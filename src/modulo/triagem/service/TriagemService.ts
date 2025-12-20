import {supabaseClient} from '../../../shared/database/supabase';
import {Triagem} from '../model/Triagem';
import {Paciente} from '../../paciente/model/Paciente';
import {NivelGravidade, Papeis} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';
import {PrioridadeService} from './PrioridadeService';

const supabase = supabaseClient;

export class TriagemService {
    async createTriagem(
        pacienteId: string,
        enfermeiroId: string,
        unidadeSaudeId: string,
        sinaisVitais: SinaisVitais,
        queixaPrincipal: string
    ): Promise<{ data: Triagem | null, error: Error | null }> {
        try {
            if (!pacienteId || !enfermeiroId || !unidadeSaudeId || !sinaisVitais || !queixaPrincipal) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (queixaPrincipal.length < 3) {
                throw new Error('Queixa principal deve ter pelo menos 3 caracteres');
            }
            if (sinaisVitais.saturacaoOxigenio && (sinaisVitais.saturacaoOxigenio < 0 || sinaisVitais.saturacaoOxigenio > 100)) {
                throw new Error('Saturação de oxigênio inválida (0-100%)');
            }
            if (sinaisVitais.frequenciaRespiratoria && (sinaisVitais.frequenciaRespiratoria < 0 || sinaisVitais.frequenciaRespiratoria > 60)) {
                throw new Error('Frequência respiratória inválida (0-60/min)');
            }
            if (sinaisVitais.pressaoArterialSistolica && (sinaisVitais.pressaoArterialSistolica < 0 || sinaisVitais.pressaoArterialSistolica > 300)) {
                throw new Error('Pressão arterial sistólica inválida (0-300 mmHg)');
            }
            if (sinaisVitais.pressaoArterialDiastolica && (sinaisVitais.pressaoArterialDiastolica < 0 || sinaisVitais.pressaoArterialDiastolica > 200)) {
                throw new Error('Pressão arterial diastólica inválida (0-200 mmHg)');
            }
            if (sinaisVitais.frequenciaCardiaca && (sinaisVitais.frequenciaCardiaca < 0 || sinaisVitais.frequenciaCardiaca > 200)) {
                throw new Error('Frequência cardíaca inválida (0-200 bpm)');
            }
            if (sinaisVitais.temperatura && (sinaisVitais.temperatura < 32 || sinaisVitais.temperatura > 43)) {
                throw new Error('Temperatura inválida (32-43°C)');
            }
            if (sinaisVitais.nivelDor && (sinaisVitais.nivelDor < 0 || sinaisVitais.nivelDor > 10)) {
                throw new Error('Nível de dor inválido (0-10)');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('*')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();
            if (!paciente) {
                throw new Error('Paciente não encontrado');
            }
            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', unidadeSaudeId)
                .single();
            if (!unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            const pacienteObj = new Paciente(
                paciente.id,
                paciente.nome,
                paciente.cpf,
                paciente.cns,
                new Date(paciente.data_nascimento),
                paciente.sexo,
                paciente.raca_cor,
                paciente.escolaridade,
                {
                    logradouro: paciente.endereco_logradouro,
                    numero: paciente.endereco_numero,
                    bairro: paciente.endereco_bairro,
                    cidade: paciente.endereco_cidade,
                    estado: paciente.endereco_estado,
                    cep: paciente.endereco_cep,
                },
                paciente.telefone,
                paciente.grupos_risco,
                paciente.consentimento_lgpd,
                paciente.email
            );
            const {
                data: nivelGravidade,
                error: gravidadeError
            } = PrioridadeService.calcularNivelGravidade(pacienteObj, sinaisVitais, queixaPrincipal);
            if (gravidadeError || !nivelGravidade) {
                throw new Error(`Erro ao calcular nível de gravidade: ${gravidadeError?.message || 'Erro desconhecido'}`);
            }

            const {data, error} = await supabase
                .from('triagem')
                .insert({
                    paciente_id: pacienteId,
                    enfermeiro_id: enfermeiroId,
                    unidade_saude_id: unidadeSaudeId,
                    nivel_gravidade: nivelGravidade,
                    sinais_vitais: sinaisVitais,
                    queixa_principal: queixaPrincipal,
                    ativo: true,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar triagem: ${error.message}`);

            const triagem = new Triagem(
                data.id,
                data.paciente_id,
                data.enfermeiro_id,
                data.unidade_saude_id,
                data.nivel_gravidade,
                data.sinais_vitais,
                data.queixa_principal
            );
            return {data: triagem, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getAllTriagens(usuarioId: string): Promise<{ data: Triagem[], error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prontuários');
            }

            const {data, error} = await supabase
                .from('triagem')
                .select('*')
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar triagens: ${error.message}`);

            const triagens = data.map((d: any) => new Triagem(
                d.id,
                d.paciente_id,
                d.enfermeiro_id,
                d.unidade_saude_id,
                d.nivel_gravidade,
                d.sinais_vitais,
                d.queixa_principal
            ));
            return {data: triagens, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getTriagem(id: string): Promise<{ data: Triagem | null, error: Error | null }> {
        try {
            const {data, error} = await supabase
                .from('triagem')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) return {data: null, error: new Error('Triagem não encontrada')};

            const triagem = new Triagem(
                data.id,
                data.paciente_id,
                data.enfermeiro_id,
                data.unidade_saude_id,
                data.nivel_gravidade,
                data.sinais_vitais,
                data.queixa_principal
            );
            return {data: triagem, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listTriagensByPaciente(pacienteId: string): Promise<{
        data: Triagem[],
        error: Error | null
    }> {
        try {
            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();
            if (!paciente) throw new Error('Paciente não encontrado');

            const {data, error} = await supabase
                .from('triagem')
                .select('*')
                .eq('paciente_id', pacienteId)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar triagens: ${error.message}`);

            const triagens = data.map((d: any) => new Triagem(
                d.id,
                d.paciente_id,
                d.enfermeiro_id,
                d.unidade_saude_id,
                d.nivel_gravidade,
                d.sinais_vitais,
                d.queixa_principal
            ));
            return {data: triagens, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listPacientesByGravidade(
        nivelGravidade: NivelGravidade,
        unidadeSaudeId: string,
    ): Promise<{ data: Paciente[], error: Error | null }> {
        try {
            if (!Object.values(NivelGravidade).includes(nivelGravidade)) {
                throw new Error('Nível de gravidade inválido');
            }
            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', unidadeSaudeId)
                .single();
            if (!unidade) throw new Error('Unidade de saúde não encontrada');

            const {data: triagens, error: triagemError} = await supabase
                .from('triagem')
                .select('paciente_id')
                .eq('unidade_saude_id', unidadeSaudeId)
                .eq('nivel_gravidade', nivelGravidade)
                .eq('ativo', true)
                .limit(100);

            if (triagemError) throw new Error(`Erro ao listar triagens: ${triagemError.message}`);
            const pacienteIds = triagens.map((t: any) => t.paciente_id);

            const {data, error} = await supabase
                .from('paciente')
                .select('*')
                .in('id', pacienteIds)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar pacientes: ${error.message}`);

            const pacientes = data.map((d: any) => new Paciente(
                d.id,
                d.nome,
                d.cpf,
                d.cns,
                new Date(d.data_nascimento),
                d.sexo,
                d.raca_cor,
                d.escolaridade,
                {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                },
                d.telefone,
                d.grupos_risco,
                d.consentimento_lgpd,
                d.email
            ));
            return {data: pacientes, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateTriagem(
        id: string,
        nivelGravidade?: NivelGravidade,
        sinaisVitais?: SinaisVitais,
        queixaPrincipal?: string,
        enfermeiroId?: string
    ): Promise<{ data: Triagem | null, error: Error | null }> {
        try {
            if (!enfermeiroId) throw new Error('ID do enfermeiro é obrigatório');
            const {data: triagem} = await supabase
                .from('triagem')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!triagem) throw new Error('Triagem não encontrada');

            const updates: any = {};

            if (!nivelGravidade && (sinaisVitais || queixaPrincipal)) {
                const {data: paciente} = await supabase
                    .from('paciente')
                    .select('*')
                    .eq('id', triagem.paciente_id)
                    .eq('ativo', true)
                    .single();
                if (!paciente) throw new Error('Paciente não encontrado');
                const pacienteObj = new Paciente(
                    paciente.id,
                    paciente.nome,
                    paciente.cpf,
                    paciente.cns,
                    new Date(paciente.data_nascimento),
                    paciente.sexo,
                    paciente.raca_cor,
                    paciente.escolaridade,
                    {
                        logradouro: paciente.endereco_logradouro,
                        numero: paciente.endereco_numero,
                        bairro: paciente.endereco_bairro,
                        cidade: paciente.endereco_cidade,
                        estado: paciente.endereco_estado,
                        cep: paciente.endereco_cep,
                    },
                    paciente.telefone,
                    paciente.grupos_risco,
                    paciente.consentimento_lgpd,
                    paciente.email
                );
                const {data: gravidade, error: gravidadeError} = PrioridadeService.calcularNivelGravidade(
                    pacienteObj,
                    sinaisVitais || triagem.sinais_vitais,
                    queixaPrincipal || triagem.queixa_principal
                );
                if (gravidadeError || !gravidade) {
                    throw new Error(`Erro ao calcular nível de gravidade: ${gravidadeError?.message || 'Erro desconhecido'}`);
                }
                updates.nivel_gravidade = gravidade;
            } else if (nivelGravidade) {
                updates.nivel_gravidade = nivelGravidade;
            }

            if (sinaisVitais) updates.sinais_vitais = sinaisVitais;
            if (queixaPrincipal) updates.queixa_principal = queixaPrincipal;

            const {data, error} = await supabase
                .from('triagem')
                .update(updates)
                .eq('id', id)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) return {data: null, error: new Error('Triagem não encontrada')};

            const triagemAtualizada = new Triagem(
                data.id,
                data.paciente_id,
                data.enfermeiro_id,
                data.unidade_saude_id,
                data.nivel_gravidade,
                data.sinais_vitais,
                data.queixa_principal
            );
            return {data: triagemAtualizada, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteTriagem(id: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: triagem} = await supabase
                .from('triagem')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!triagem) throw new Error('Triagem não encontrada');

            const {error} = await supabase
                .from('triagem')
                .update({ativo: false, data_desativacao: new Date().toISOString()})
                .eq('id', id);

            if (error) throw new Error(`Erro ao desativar triagem: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}