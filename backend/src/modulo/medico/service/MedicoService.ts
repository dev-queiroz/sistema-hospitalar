import {supabaseClient} from '../../../shared/database/supabase';
import {Medico} from '../model/Medico';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

const supabase = supabaseClient;

export class MedicoService {
    async createMedico(
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        email: string,
        senha: string,
        dataContratacao: Date,
        crm: string,
        adminId: string,
        unidadeSaudeId?: string
    ): Promise<{ data: Medico | null, error: Error | null }> {
        try {
            if (!nome || !cpf || !cns || !dataNascimento || !sexo || !racaCor || !escolaridade || !endereco ||
                !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado || !endereco.cep ||
                !telefone || !email || !senha || !dataContratacao || !crm) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (!/^\d{11}$/.test(cpf)) throw new Error('CPF inválido (deve ter 11 dígitos)');
            if (!/^\d{15}$/.test(cns)) throw new Error('CNS inválido (deve ter 15 dígitos)');
            if (!/^\d{10,11}$/.test(telefone)) throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            if (!/^\d{8}$/.test(endereco.cep)) throw new Error('CEP inválido (deve ter 8 dígitos)');
            if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error('Email inválido');
            if (!/^\d{5,6}-[A-Z]{2}$/.test(crm)) throw new Error('CRM inválido (ex: 12345-SP ou 123456-SP)');

            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar médicos');
            }

            const {data: existing} = await supabase
                .from('funcionario')
                .select('id')
                .or(`cpf.eq.${cpf},cns.eq.${cns},crm.eq.${crm},email.eq.${email}`);
            if (existing && existing?.length > 0) {
                throw new Error('CPF, CNS, CRM ou email já cadastrado');
            }

            if (unidadeSaudeId) {
                const {data: unidade} = await supabase
                    .from('unidade_saude')
                    .select('id')
                    .eq('id', unidadeSaudeId)
                    .single();
                if (!unidade) throw new Error('Unidade de saúde não encontrada');
            }

            const {data: authData, error: authError} = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {papel: Papeis.MEDICO, nome},
                },
            });

            if (authError || !authData.user) {
                throw new Error(`Erro ao registrar usuário: ${authError?.message || 'Erro desconhecido'}`);
            }

            const userId = authData.user.id;

            const {data, error} = await supabase
                .from('funcionario')
                .insert({
                    id: userId,
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
                    grupos_risco: [],
                    consentimento_lgpd: true,
                    papel: Papeis.MEDICO,
                    data_contratacao: dataContratacao.toISOString(),
                    crm: crm,
                    criado_por: adminId,
                    ativo: true,
                })
                .select()
                .single();

            if (error) {
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Erro ao criar médico: ${error.message}`);
            }

            if (unidadeSaudeId) {
                const {error: linkError} = await supabase
                    .from('funcionario_unidade')
                    .insert({funcionario_id: userId, unidade_saude_id: unidadeSaudeId});
                if (linkError) {
                    await supabase.auth.admin.deleteUser(userId);
                    await supabase.from('funcionario').delete().eq('id', userId);
                    throw new Error(`Erro ao associar médico à unidade: ${linkError.message}`);
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

            const medico = new Medico(
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
                new Date(data.data_contratacao),
                data.crm,
                data.email
            );
            return {data: medico, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getMedico(id: string): Promise<{ data: Medico | null, error: Error | null }> {
        try {
            const {data, error} = await supabase
                .from('funcionario')
                .select('*')
                .eq('id', id)
                .eq('papel', Papeis.MEDICO)
                .eq('ativo', true)
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Médico não encontrado')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const medico = new Medico(
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
                new Date(data.data_contratacao),
                data.crm,
                data.email
            );
            return {data: medico, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateMedico(
        id: string,
        nome?: string,
        crm?: string,
        dataContratacao?: Date,
        adminId?: string
    ): Promise<{ data: Medico | null, error: Error | null }> {
        try {
            if (!adminId) throw new Error('ID do administrador é obrigatório');
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar médicos');
            }

            if (crm && !/^\d{5,6}-[A-Z]{2}$/.test(crm)) {
                throw new Error('CRM inválido (ex: 12345-SP ou 123456-SP)');
            }

            const updates: any = {};
            if (nome) updates.nome = nome;
            if (crm) updates.crm = crm;
            if (dataContratacao) updates.data_contratacao = dataContratacao.toISOString();

            if (crm) {
                const {data: existing} = await supabase
                    .from('funcionario')
                    .select('id')
                    .eq('crm', crm)
                    .neq('id', id);
                if (existing && existing?.length > 0) {
                    throw new Error('CRM já cadastrado');
                }
            }

            const {data, error} = await supabase
                .from('funcionario')
                .update(updates)
                .eq('id', id)
                .eq('papel', Papeis.MEDICO)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Médico não encontrado')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const medico = new Medico(
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
                new Date(data.data_contratacao),
                data.crm,
                data.email
            );
            return {data: medico, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteMedico(id: string, adminId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode desativar médicos');
            }

            const {data: medico} = await supabase
                .from('funcionario')
                .select('id')
                .eq('id', id)
                .eq('papel', Papeis.MEDICO)
                .eq('ativo', true)
                .single();
            if (!medico) {
                throw new Error('Médico não encontrado');
            }

            const {error: authError} = await supabase.auth.admin.updateUserById(id, {user_metadata: {disabled: true}});
            if (authError) {
                throw new Error(`Erro ao desativar usuário no Supabase Auth: ${authError.message}`);
            }

            const {error} = await supabase
                .from('funcionario')
                .update({ativo: false, data_demissao: new Date().toISOString()})
                .eq('id', id)
                .eq('papel', Papeis.MEDICO);

            if (error) throw new Error(`Erro ao desativar médico: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listMedicos(): Promise<{ data: Medico[], error: Error | null }> {
        try {
            const {data, error} = await supabase
                .from('funcionario')
                .select('*')
                .eq('papel', Papeis.MEDICO)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar médicos: ${error.message}`);

            const medicos = data.map((d: any) => {
                const endereco: Endereco = {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                };
                return new Medico(
                    d.id,
                    d.nome,
                    d.cpf,
                    d.cns,
                    new Date(d.data_nascimento),
                    d.sexo,
                    d.raca_cor,
                    d.escolaridade,
                    endereco,
                    d.telefone,
                    d.grupos_risco,
                    d.consentimento_lgpd,
                    new Date(d.data_contratacao),
                    d.crm,
                    d.email
                );
            });
            return {data: medicos, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}