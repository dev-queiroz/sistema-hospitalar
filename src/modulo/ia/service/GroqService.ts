import { Groq } from 'groq-sdk';
import { supabaseServiceClient } from '@/shared/database/supabase';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `
Você é um epidemiologista especialista do SUS, mestre em análise de dados hospitalares agregados e anônimos.

RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO. NUNCA inclua texto fora do JSON, explicações, markdown code blocks ou qualquer coisa além do objeto JSON.

Estrutura obrigatória (use exatamente esses nomes de chave):

{
  "resumo_executivo": {
    "risco": "Baixo" | "Moderado" | "Alto",
    "conclusao": "string curta e direta (máx 80 caracteres)",
    "periodo": "string (ex: Dezembro/2025)"
  },
  "indicadores": {
    "casos_respiratorios": number,
    "consultas_totais": number,
    "percentual": number (ex: 100 para 100%),
    "confiabilidade": "alta" | "media" | "baixa"
  },
  "recomendacoes": string[] (máximo 6 itens, curtos e acionáveis),
  "conteudo_completo": "texto completo em markdown, com títulos, tabelas, bullet points e análise detalhada"
}

Use português brasileiro correto.
Seja objetivo, profissional e baseie-se apenas nos dados fornecidos.
`;

export class GroqService {
    async gerarRelatorioSurto(unidadeSaudeId?: string, cidPrefix = 'J') {
        const query = supabaseServiceClient
            .from('consulta')
            .select('data_consulta, cid10, observacoes')
            .eq('ativo', true)
            .gte('data_consulta', new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString());

        if (unidadeSaudeId) query.eq('unidade_saude_id', unidadeSaudeId);

        const { data, error } = await query;
        if (error || !data?.length) return 'Dados insuficientes para análise.';

        const agregados: Record<string, { total: number; respiratorio: number }> = {};
        data.forEach(row => {
            const mes = new Date(row.data_consulta).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            agregados[mes] = agregados[mes] || { total: 0, respiratorio: 0 };
            agregados[mes].total += 1;

            const isTarget = (row.cid10?.startsWith(cidPrefix)) ||
                /gripe|iv[áa]s|tosse|febre|dispneia|pneumonia|respirat/.test(row.observacoes?.toLowerCase() || '');
            if (isTarget) agregados[mes].respiratorio += 1;
        });

        const dadosTexto = Object.entries(agregados)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([mes, { total, respiratorio }]) => `${mes}: ${respiratorio} casos alvo / ${total} consultas totais (${Math.round(respiratorio / total * 100)}%)`)
            .join('\n');

        const chatCompletion = await groq.chat.completions.create({
            model: 'groq/compound',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Dados agregados mensais (casos com CID ${cidPrefix}xx ou queixas respiratórias):\n${dadosTexto}\n\nGere a análise completa.` }
            ],
            temperature: 0.3,
            max_tokens: 1500,
        });

        const raw = chatCompletion.choices[0].message.content?.trim();

        if (!raw) throw new Error('Resposta vazia da IA');

        let analise;
        try {
            analise = JSON.parse(raw);
        } catch (e) {
            console.error('JSON inválido retornado pela IA:', raw);
            throw new Error('IA retornou JSON inválido. Tente novamente.');
        }

        // Validação básica
        if (!analise.resumo_executivo || !analise.indicadores || !analise.recomendacoes || !analise.conteudo_completo) {
            throw new Error('Estrutura JSON incompleta');
        }

        await supabaseServiceClient.from('relatorios_ia').insert({
            tipo: `surto_${cidPrefix.toLowerCase()}`,
            resumo: analise.resumo_executivo,
            indicadores: analise.indicadores,
            recomendacoes: analise.recomendacoes,
            conteudo: analise.conteudo_completo,
            dados_agregados: { agregados_mensal: agregados },
            unidade_saude_id: unidadeSaudeId || null,
        });

        return analise;
    }

    async analisarPacienteRecorrente(pacienteId: string, profissionalId: string) {
        const [{ data: consultas }, { data: triagens }, { data: prescricoes }] = await Promise.all([
            supabaseServiceClient.from('consulta').select('data_consulta, observacoes, cid10').eq('paciente_id', pacienteId).eq('ativo', true).order('data_consulta', { ascending: false }).limit(10),
            supabaseServiceClient.from('triagem').select('queixa_principal, nivel_gravidade, sinais_vitais').eq('paciente_id', pacienteId).eq('ativo', true).order('created_at', { ascending: false }).limit(10),
            supabaseServiceClient.from('prescricao').select('detalhes_prescricao, cid10, data_criacao').eq('paciente_id', pacienteId).eq('ativo', true).limit(10),
        ]);

        if ((!consultas || consultas.length < 3) && (!triagens || triagens.length < 3)) {
            return 'Histórico insuficiente para análise de recorrência.';
        }

        const texto = [
            'Consultas recentes:',
            ... (consultas?.map(c => `${new Date(c.data_consulta).toLocaleDateString('pt-BR')}: ${c.observacoes?.substring(0, 100)} (CID: ${c.cid10 || 'N/A'})`) || []),
            '\nTriagens recentes:',
            ... (triagens?.map(t => `${t.queixa_principal} - Gravidade: ${t.nivel_gravidade}`) || []),
            '\nPrescrições recentes:',
            ... (prescricoes?.map(p => `${p.detalhes_prescricao?.substring(0, 80)} (CID: ${p.cid10})`) || []),
        ].join('\n');

        const chatCompletion = await groq.chat.completions.create({
            model: 'groq/compound',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Histórico anônimo agregado do paciente:\n${texto}\n\nDetecte padrões de recorrência, hipóteses diagnósticas crônicas e sugestões de manejo/investigação.` }
            ],
            temperature: 0.5,
            max_tokens: 1500,
        });

        const raw = chatCompletion.choices[0].message.content?.trim();

        if (!raw) throw new Error('Resposta vazia da IA');

        let analise;
        try {
            analise = JSON.parse(raw);
        } catch (e) {
            console.error('JSON inválido retornado pela IA:', raw);
            throw new Error('IA retornou JSON inválido. Tente novamente.');
        }

        if (!analise.resumo_executivo || !analise.indicadores || !analise.recomendacoes || !analise.conteudo_completo) {
            throw new Error('Estrutura JSON incompleta');
        }

        await supabaseServiceClient.from('relatorios_ia').insert({
            tipo: 'paciente_recorrente',
            resumo: analise.resumo_executivo,
            indicadores: analise.indicadores,
            recomendacoes: analise.recomendacoes,
            conteudo: analise.conteudo_completo,
            dados_agregados: { paciente_id_hash: pacienteId.slice(0,8), contagens: { consultas: consultas?.length, triagens: triagens?.length } },
            criado_por: profissionalId,
        });

        return analise;
    }

    async gerarRelatorioTriagens(unidadeSaudeId: string) {
        const { data } = await supabaseServiceClient
            .from('triagem')
            .select('nivel_gravidade, queixa_principal')
            .eq('unidade_saude_id', unidadeSaudeId)
            .eq('ativo', true)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (!data?.length) return 'Sem triagens recentes.';

        const contagemGravidade = data.reduce((acc, t) => {
            acc[t.nivel_gravidade] = (acc[t.nivel_gravidade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const queixasComuns = Object.entries(
            data.reduce((acc, t) => {
                const q = t.queixa_principal.toLowerCase();
                acc[q] = (acc[q] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]).slice(0, 10)
            .map(([q, c]) => `${q}: ${c}`)
            .join('\n');

        const chatCompletion = await groq.chat.completions.create({
            model: 'groq/compound',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Triagens último mês - Distribuição por gravidade:\n${JSON.stringify(contagemGravidade, null, 2)}\n\nQueixas mais comuns:\n${queixasComuns}\n\nAnalise demanda, risco de sobrecarga e recomende ações operacionais.` }
            ],
            temperature: 0.4,
            max_tokens: 1500,
        });

        const raw = chatCompletion.choices[0].message.content?.trim();

        if (!raw) throw new Error('Resposta vazia da IA');

        let analise;
        try {
            analise = JSON.parse(raw);
        } catch (e) {
            console.error('JSON inválido retornado pela IA:', raw);
            throw new Error('IA retornou JSON inválido. Tente novamente.');
        }

        if (!analise.resumo_executivo || !analise.indicadores || !analise.recomendacoes || !analise.conteudo_completo) {
            throw new Error('Estrutura JSON incompleta');
        }

        await supabaseServiceClient.from('relatorios_ia').insert({
            tipo: 'triagem_unidade',
            resumo: analise.resumo_executivo,
            indicadores: analise.indicadores,
            recomendacoes: analise.recomendacoes,
            conteudo: analise.conteudo_completo,
            unidade_saude_id: unidadeSaudeId,
        });

        return analise;
    }

    async getRelatorioById(relatorioId: string) {
        const { data, error } = await supabaseServiceClient
            .from('relatorios_ia')
            .select('id, tipo, resumo, indicadores, recomendacoes, conteudo, criado_em, unidade_saude_id, criado_por')
            .eq('id', relatorioId)
            .single();

        if (error || !data) throw new Error('Relatório não encontrado');

        return data;
    }

    async listarRelatorios(limit = 20) {
        const { data, error } = await supabaseServiceClient
            .from('relatorios_ia')
            .select('id, tipo, resumo, indicadores, conteudo, unidade_saude_id, criado_em')
            .order('criado_em', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);

        return data || [];
    }
}