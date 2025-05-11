import {supabaseClient} from '../../../shared/database/supabase';
import {Paciente} from '../model/Paciente';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';
import {Prontuario} from '../../prontuario/model/Prontuario';
import {Prescricao} from '../../prescricao/model/Prescricao';
import {Consulta} from '../../consulta/model/Consulta';

const supabase = supabaseClient;
const GRUPOS_RISCO_PERMITIDOS = ['IDOSO', 'GESTANTE', 'DIABETICO', 'HIPERTENSO', 'IMUNOSSUPRIMIDO', 'CRIANCA'];

export class PacienteService {
    async createPaciente(
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        gruposRisco: string[],
        consentimentoLGPD: boolean,
        usuarioId: string,
        email?: string,
        unidadeSaudeId?: string
    ): Promise<{ data: Paciente | null, error: Error | null }> {
        try {
            if (
                !nome ||
                !cpf ||
                !cns ||
                !dataNascimento ||
                !sexo ||
                !racaCor ||
                !escolaridade ||
                !endereco ||
                !endereco.logradouro ||
                !endereco.numero ||
                !endereco.bairro ||
                !endereco.cidade ||
                !endereco.estado ||
                !endereco.cep ||
                !telefone ||
                !gruposRisco ||
                consentimentoLGPD === undefined
            ) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (!/^\d{11}$/.test(cpf)) throw new Error('CPF inválido (deve ter 11 dígitos)');
            if (!/^\d{15}$/.test(cns)) throw new Error('CNS inválido (deve ter 15 dígitos)');
            if (!/^\d{10,11}$/.test(telefone)) throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            if (!/^\d{8}$/.test(endereco.cep)) throw new Error('CEP inválido (deve ter 8 dígitos)');
            if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error('Email inválido');
            if (!consentimentoLGPD) throw new Error('Consentimento LGPD é obrigatório para cadastro');
            if (!gruposRisco.every((g) => GRUPOS_RISCO_PERMITIDOS.includes(g))) {
                throw new Error(`Grupos de risco inválidos. Valores permitidos: ${GRUPOS_RISCO_PERMITIDOS.join(', ')}`);
            }

            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem criar pacientes');
            }

            const {data: existing} = await supabase
                .from('paciente')
                .select('id')
                .or(`cpf.eq.${cpf},cns.eq.${cns}${email ? `,email.eq.${email}` : ''}`)
                .eq('ativo', true);
            if (existing && existing.length > 0) {
                throw new Error('CPF, CNS ou email já cadastrado');
            }

            if (unidadeSaudeId) {
                const {data: unidade} = await supabase
                    .from('unidade_saude')
                    .select('id')
                    .eq('id', unidadeSaudeId)
                    .single();
                if (!unidade) throw new Error('Unidade de saúde não encontrada');
            }

            const {data, error} = await supabase
                .from('paciente')
                .insert({
                    nome,
                    cpf,
                    cns,
                    data_nascimento: dataNascimento.toISOString(),
                    sexo,
                    raca_cor: racaCor,
                    escolaridade,
                    endereco_logradouro: endereco.logradouro,
                    endereco_numero: endereco.numero,
                    endereco_bairro: endereco.bairro,
                    endereco_cidade: endereco.cidade,
                    endereco_estado: endereco.estado,
                    endereco_cep: endereco.cep,
                    telefone,
                    email,
                    grupos_risco: gruposRisco,
                    consentimento_lgpd: consentimentoLGPD,
                    criado_por: usuarioId,
                    ativo: true,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar paciente: ${error.message}`);

            if (unidadeSaudeId) {
                const {error: linkError} = await supabase
                    .from('paciente_unidade')
                    .insert({paciente_id: data.id, unidade_saude_id: unidadeSaudeId});
                if (linkError) {
                    await supabase.from('paciente').delete().eq('id', data.id);
                    throw new Error(`Erro ao associar paciente à unidade: ${linkError.message}`);
                }
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const paciente = new Paciente(
                data.id,
                data.nome,
                data.cpf,
                data.cns,
                new Date(data.data_nascimento),
                data.sexo,
                data.raca_cor,
                data.escolaridade,
                enderecoReturn,
                data.telefone,
                data.grupos_risco,
                data.consentimento_lgpd,
                data.email
            );
            return {data: paciente, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getPaciente(id: string, usuarioId: string): Promise<{ data: Paciente | null, error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (
                !usuario ||
                (usuario.papel !== Papeis.ENFERMEIRO &&
                    usuario.papel !== Papeis.MEDICO &&
                    usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)
            ) {
                throw new Error('Apenas ENFERMEIRO, MEDICO ou ADMINISTRADOR_PRINCIPAL podem visualizar pacientes');
            }

            const {data, error} = await supabase
                .from('paciente')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) return {data: null, error: new Error('Paciente não encontrado')};

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const paciente = new Paciente(
                data.id,
                data.nome,
                data.cpf,
                data.cns,
                new Date(data.data_nascimento),
                data.sexo,
                data.raca_cor,
                data.escolaridade,
                enderecoReturn,
                data.telefone,
                data.grupos_risco,
                data.consentimento_lgpd,
                data.email
            );
            return {data: paciente, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updatePaciente(
        id: string,
        nome?: string,
        cpf?: string,
        cns?: string,
        dataNascimento?: Date,
        sexo?: Sexo,
        racaCor?: RacaCor,
        escolaridade?: Escolaridade,
        endereco?: Endereco,
        telefone?: string,
        gruposRisco?: string[],
        consentimentoLGPD?: boolean,
        usuarioId?: string,
        email?: string,
        unidadeSaudeId?: string
    ): Promise<{ data: Paciente | null, error: Error | null }> {
        try {
            if (!usuarioId) throw new Error('ID do usuário é obrigatório');
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem atualizar pacientes');
            }

            if (cpf && !/^\d{11}$/.test(cpf)) throw new Error('CPF inválido (deve ter 11 dígitos)');
            if (cns && !/^\d{15}$/.test(cns)) throw new Error('CNS inválido (deve ter 15 dígitos)');
            if (telefone && !/^\d{10,11}$/.test(telefone)) throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            if (endereco?.cep && !/^\d{8}$/.test(endereco.cep)) throw new Error('CEP inválido (deve ter 8 dígitos)');
            if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error('Email inválido');
            if (consentimentoLGPD === false) throw new Error('Consentimento LGPD não pode ser revogado após cadastro');
            if (gruposRisco && !gruposRisco.every((g) => GRUPOS_RISCO_PERMITIDOS.includes(g))) {
                throw new Error(`Grupos de risco inválidos. Valores permitidos: ${GRUPOS_RISCO_PERMITIDOS.join(', ')}`);
            }

            if (unidadeSaudeId) {
                const {data: unidade} = await supabase
                    .from('unidade_saude')
                    .select('id')
                    .eq('id', unidadeSaudeId)
                    .single();
                if (!unidade) throw new Error('Unidade de saúde não encontrada');
            }

            const updates: any = {};
            if (nome) updates.nome = nome;
            if (cpf) updates.cpf = cpf;
            if (cns) updates.cns = cns;
            if (dataNascimento) updates.data_nascimento = dataNascimento.toISOString();
            if (sexo) updates.sexo = sexo;
            if (racaCor) updates.raca_cor = racaCor;
            if (escolaridade) updates.escolaridade = escolaridade;
            if (endereco) {
                updates.endereco_logradouro = endereco.logradouro;
                updates.endereco_numero = endereco.numero;
                updates.endereco_bairro = endereco.bairro;
                updates.endereco_cidade = endereco.cidade;
                updates.endereco_estado = endereco.estado;
                updates.endereco_cep = endereco.cep;
            }
            if (telefone) updates.telefone = telefone;
            if (gruposRisco) updates.grupos_risco = gruposRisco;
            if (consentimentoLGPD !== undefined) updates.consentimento_lgpd = consentimentoLGPD;
            if (email !== undefined) updates.email = email;

            if (cpf || cns || email) {
                const {data: existing} = await supabase
                    .from('paciente')
                    .select('id')
                    .or(`cpf.eq.${cpf || ''},cns.eq.${cns || ''}${email ? `,email.eq.${email}` : ''}`)
                    .neq('id', id)
                    .eq('ativo', true);
                if (existing && existing.length > 0) {
                    throw new Error('CPF, CNS ou email já cadastrado');
                }
            }

            const {data, error} = await supabase
                .from('paciente')
                .update(updates)
                .eq('id', id)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) return {data: null, error: new Error('Paciente não encontrado')};

            if (unidadeSaudeId) {
                const {error: linkError} = await supabase
                    .from('paciente_unidade')
                    .upsert({paciente_id: id, unidade_saude_id: unidadeSaudeId}, {onConflict: 'paciente_id'});
                if (linkError) throw new Error(`Erro ao associar paciente à unidade: ${linkError.message}`);
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const paciente = new Paciente(
                data.id,
                data.nome,
                data.cpf,
                data.cns,
                new Date(data.data_nascimento),
                data.sexo,
                data.raca_cor,
                data.escolaridade,
                enderecoReturn,
                data.telefone,
                data.grupos_risco,
                data.consentimento_lgpd,
                data.email
            );
            return {data: paciente, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deletePaciente(id: string, usuarioId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem desativar pacientes');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!paciente) throw new Error('Paciente não encontrado');

            const {error} = await supabase
                .from('paciente')
                .update({ativo: false, data_desativacao: new Date().toISOString()})
                .eq('id', id);

            if (error) throw new Error(`Erro ao desativar paciente: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listPacientes(usuarioId: string): Promise<{ data: Paciente[], error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (
                !usuario ||
                (usuario.papel !== Papeis.ENFERMEIRO &&
                    usuario.papel !== Papeis.MEDICO &&
                    usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)
            ) {
                throw new Error('Apenas ENFERMEIRO, MEDICO ou ADMINISTRADOR_PRINCIPAL podem listar pacientes');
            }

            const {data, error} = await supabase
                .from('paciente')
                .select('*')
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar pacientes: ${error.message}`);

            const pacientes = data.map((d: any) => {
                const enderecoReturn: Endereco = {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                };
                return new Paciente(
                    d.id,
                    d.nome,
                    d.cpf,
                    d.cns,
                    new Date(d.data_nascimento),
                    d.sexo,
                    d.raca_cor,
                    d.escolaridade,
                    enderecoReturn,
                    d.telefone,
                    d.grupos_risco,
                    d.consentimento_lgpd,
                    d.email
                );
            });
            return {data: pacientes, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getPacienteHistorico(id: string, usuarioId: string): Promise<{
        data: { prontuarios: Prontuario[], prescricoes: Prescricao[], consultas: Consulta[] } | null,
        error: Error | null
    }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (
                !usuario ||
                (usuario.papel !== Papeis.ENFERMEIRO &&
                    usuario.papel !== Papeis.MEDICO &&
                    usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)
            ) {
                throw new Error('Apenas ENFERMEIRO, MEDICO ou ADMINISTRADOR_PRINCIPAL podem visualizar histórico');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!paciente) return {data: null, error: new Error('Paciente não encontrado')};

            const [prontuarios, prescricoes, consultas] = await Promise.all([
                supabase
                    .from('prontuario')
                    .select('*')
                    .eq('paciente_id', id)
                    .eq('ativo', true)
                    .limit(100)
                    .then(({data, error}) => {
                        if (error) throw new Error(`Erro ao buscar prontuários: ${error.message}`);
                        return data.map(
                            (d: any) =>
                                new Prontuario(
                                    d.id,
                                    d.paciente_id,
                                    d.profissional_id,
                                    d.unidade_saude_id,
                                    d.descricao,
                                    d.dados_anonimizados
                                )
                        );
                    }),
                supabase
                    .from('prescricao')
                    .select('*')
                    .eq('paciente_id', id)
                    .eq('ativo', true)
                    .limit(100)
                    .then(({data, error}) => {
                        if (error) throw new Error(`Erro ao buscar prescrições: ${error.message}`);
                        return data.map(
                            (d: any) =>
                                new Prescricao(
                                    d.id,
                                    d.paciente_id,
                                    d.profissional_id,
                                    d.unidade_saude_id,
                                    d.detalhes_prescricao,
                                    d.cid10,
                                    new Date(d.data_criacao)
                                )
                        );
                    }),
                supabase
                    .from('consulta')
                    .select('*')
                    .eq('paciente_id', id)
                    .eq('ativo', true)
                    .limit(100)
                    .then(({data, error}) => {
                        if (error) throw new Error(`Erro ao buscar consultas: ${error.message}`);
                        return data.map(
                            (d: any) =>
                                new Consulta(
                                    d.id,
                                    d.paciente_id,
                                    d.profissional_id,
                                    d.unidade_saude_id,
                                    d.observacoes,
                                    d.cid10,
                                    d.data_criacao
                                )
                        );
                    }),
            ]);

            return {data: {prontuarios, prescricoes, consultas}, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}