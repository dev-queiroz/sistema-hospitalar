import {supabaseClient} from '../../../shared/database/supabase';
import {Enfermeiro} from '../model/Enfermeiro';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

const supabase = supabaseClient;

export class EnfermeiroService {
    async createEnfermeiro(
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
        coren: string,
        adminId: string,
        unidadeSaudeId?: string
    ): Promise<{ data: Enfermeiro | null, error: Error | null }> {
        try {
            if (!nome || !cpf || !cns || !dataNascimento || !sexo || !racaCor || !escolaridade || !endereco ||
                !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado || !endereco.cep ||
                !telefone || !email || !senha || !dataContratacao || !coren) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (!/^\d{11}$/.test(cpf)) throw new Error('CPF inválido (deve ter 11 dígitos)');
            if (!/^\d{15}$/.test(cns)) throw new Error('CNS inválido (deve ter 15 dígitos)');
            if (!/^\d{10,11}$/.test(telefone)) throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            if (!/^\d{8}$/.test(endereco.cep)) throw new Error('CEP inválido (deve ter 8 dígitos)');
            if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error('Email inválido');
            if (!/^\d{6}-[A-Z]{2}$/.test(coren)) throw new Error('COREN inválido (ex: 123456-SP)');

            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar enfermeiros');
            }

            const {data: existing} = await supabase
                .from('funcionario')
                .select('id')
                .or(`cpf.eq.${cpf},cns.eq.${cns},coren.eq.${coren},email.eq.${email}`);
            if ((existing ?? []).length > 0) {
                throw new Error('CPF, CNS, COREN ou email já cadastrado');
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
                    data: {papel: Papeis.ENFERMEIRO, nome},
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
                    papel: Papeis.ENFERMEIRO,
                    data_contratacao: dataContratacao.toISOString(),
                    coren,
                    criado_por: adminId,
                    ativo: true,
                })
                .select()
                .single();

            if (error) {
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Erro ao criar enfermeiro: ${error.message}`);
            }

            if (unidadeSaudeId) {
                const {error: linkError} = await supabase
                    .from('funcionario_unidade')
                    .insert({funcionario_id: userId, unidade_saude_id: unidadeSaudeId});
                if (linkError) {
                    await supabase.auth.admin.deleteUser(userId);
                    await supabase.from('funcionario').delete().eq('id', userId);
                    throw new Error(`Erro ao associar enfermeiro à unidade: ${linkError.message}`);
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

            const enfermeiro = new Enfermeiro(
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
                data.coren,
                data.email
            );
            return {data: enfermeiro, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getEnfermeiro(id: string): Promise<{ data: Enfermeiro | null, error: Error | null }> {
        try {
            const {data, error} = await supabase
                .from('funcionario')
                .select('*')
                .eq('id', id)
                .eq('papel', Papeis.ENFERMEIRO)
                .eq('ativo', true)
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Enfermeiro não encontrado')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const enfermeiro = new Enfermeiro(
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
                data.coren,
                data.email
            );
            return {data: enfermeiro, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateEnfermeiro(
        id: string,
        nome?: string,
        coren?: string,
        dataContratacao?: Date,
        adminId?: string
    ): Promise<{ data: Enfermeiro | null, error: Error | null }> {
        try {
            if (!adminId) throw new Error('ID do administrador é obrigatório');
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar enfermeiros');
            }

            if (coren && !/^\d{6}-[A-Z]{2}$/.test(coren)) {
                throw new Error('COREN inválido (ex: 123456-SP)');
            }

            const updates: any = {};
            if (nome) updates.nome = nome;
            if (coren) updates.coren = coren;
            if (dataContratacao) updates.data_contratacao = dataContratacao.toISOString();

            if (coren) {
                const {data: existing} = await supabase
                    .from('funcionario')
                    .select('id')
                    .eq('coren', coren)
                    .neq('id', id);
                if ((existing ?? []).length > 0) {
                    throw new Error('COREN já cadastrado');
                }
            }

            const {data, error} = await supabase
                .from('funcionario')
                .update(updates)
                .eq('id', id)
                .eq('papel', Papeis.ENFERMEIRO)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Enfermeiro não encontrado')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };

            const enfermeiro = new Enfermeiro(
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
                data.coren,
                data.email
            );
            return {data: enfermeiro, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteEnfermeiro(id: string, adminId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar enfermeiros');
            }

            const {data: enfermeiro} = await supabase
                .from('funcionario')
                .select('id')
                .eq('id', id)
                .eq('papel', Papeis.ENFERMEIRO)
                .eq('ativo', true)
                .single();
            if (!enfermeiro) {
                throw new Error('Enfermeiro não encontrado');
            }

            const {error: authError} = await supabase.auth.admin.updateUserById(id, {user_metadata: {disabled: true}});
            if (authError) {
                throw new Error(`Erro ao desativar usuário no Supabase Auth: ${authError.message}`);
            }

            const {error} = await supabase
                .from('funcionario')
                .update({ativo: false, data_demissao: new Date().toISOString()})
                .eq('id', id)
                .eq('papel', Papeis.ENFERMEIRO);

            if (error) throw new Error(`Erro ao desativar enfermeiro: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listEnfermeiros(adminId: string): Promise<{ data: Enfermeiro[], error: Error | null }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar enfermeiros');
            }

            const {data, error} = await supabase
                .from('funcionario')
                .select('*')
                .eq('papel', Papeis.ENFERMEIRO)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar enfermeiros: ${error.message}`);

            const enfermeiros = data.map((d: any) => {
                const endereco: Endereco = {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                };
                return new Enfermeiro(
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
                    d.coren,
                    d.email
                );
            });
            return {data: enfermeiros, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}