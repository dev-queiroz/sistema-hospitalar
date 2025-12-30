import {supabaseClient} from '../../../shared/database/supabase';
import {UnidadeSaude} from '../model/UnidadeSaude';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';
import {Medico} from '../../medico/model/Medico';
import {Enfermeiro} from '../../enfermeiro/model/Enfermeiro';

const supabase = supabaseClient;

export class UnidadeSaudeService {
    async createUnidadeSaude(
        nome: string,
        tipo: TipoUnidadeSaude,
        cnes: string,
        endereco: Endereco,
        telefone: string,
        servicosEssenciais: string[],
        servicosAmpliados: string[],
        adminId: string
    ): Promise<{ data: UnidadeSaude | null, error: Error | null }> {
        try {
            if (!nome || !tipo || !cnes || !endereco || !telefone || !servicosEssenciais ||
                !endereco.logradouro || !endereco.numero || !endereco.bairro ||
                !endereco.cidade || !endereco.estado || !endereco.cep) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (!/^\d{7}$/.test(cnes)) {
                throw new Error('CNES inválido (deve ter 7 dígitos)');
            }
            if (!/^\d{10,11}$/.test(telefone)) {
                throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            }
            if (!/^\d{8}$/.test(endereco.cep)) {
                throw new Error('CEP inválido (deve ter 8 dígitos)');
            }

            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar unidades');
            }

            const {data: existing} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('cnes', cnes);
            if (existing && existing.length > 0) {
                throw new Error('CNES já cadastrado');
            }

            const {data, error} = await supabase
                .from('unidade_saude')
                .insert({
                    nome,
                    tipo,
                    cnes,
                    endereco_logradouro: endereco.logradouro,
                    endereco_numero: endereco.numero,
                    endereco_bairro: endereco.bairro,
                    endereco_cidade: endereco.cidade,
                    endereco_estado: endereco.estado,
                    endereco_cep: endereco.cep,
                    telefone,
                    servicos_essenciais: servicosEssenciais,
                    servicos_ampliados: servicosAmpliados || [],
                    criado_por: adminId,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar unidade: ${error.message}`);

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };
            return {
                data: new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, enderecoReturn, data.telefone, data.servicos_essenciais, data.servicos_ampliados),
                error: null
            };
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getUnidadeSaude(id: string, usuarioId: string): Promise<{ data: UnidadeSaude | null, error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .single();
            if (!usuario) {
                throw new Error('Usuário inválido');
            }

            const {data, error} = await supabase
                .from('unidade_saude')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Unidade de saúde não encontrada')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };
            return {
                data: new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, enderecoReturn, data.telefone, data.servicos_essenciais, data.servicos_ampliados),
                error: null
            };
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listUnidadesSaude(adminId: string): Promise<{ data: UnidadeSaude[], error: Error | null }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar unidades');
            }

            const {data, error} = await supabase
                .from('unidade_saude')
                .select('*');

            if (error) throw new Error(`Erro ao listar unidades: ${error.message}`);

            const unidades = data.map((d: any) => {
                const endereco: Endereco = {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                };
                return new UnidadeSaude(d.id, d.nome, d.tipo, d.cnes, endereco, d.telefone, d.servicos_essenciais, d.servicos_ampliados);
            });
            return {data: unidades, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateUnidadeSaude(
        id: string,
        nome?: string,
        tipo?: TipoUnidadeSaude,
        cnes?: string,
        endereco?: Endereco,
        telefone?: string,
        servicosEssenciais?: string[],
        servicosAmpliados?: string[],
        adminId?: string
    ): Promise<{ data: UnidadeSaude | null, error: Error | null }> {
        try {
            if (!adminId) throw new Error('ID do administrador é obrigatório');
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar unidades');
            }

            if (cnes && !/^\d{7}$/.test(cnes)) {
                throw new Error('CNES inválido (deve ter 7 dígitos)');
            }
            if (telefone && !/^\d{10,11}$/.test(telefone)) {
                throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)');
            }
            if (endereco && (!endereco.logradouro || !endereco.numero || !endereco.bairro ||
                !endereco.cidade || !endereco.estado || !endereco.cep)) {
                throw new Error('Todos os campos de endereço são obrigatórios');
            }
            if (endereco && !/^\d{8}$/.test(endereco.cep)) {
                throw new Error('CEP inválido (deve ter 8 dígitos)');
            }

            const updates: any = {};
            if (nome) updates.nome = nome;
            if (tipo) updates.tipo = tipo;
            if (cnes) updates.cnes = cnes;
            if (endereco) {
                updates.endereco_logradouro = endereco.logradouro;
                updates.endereco_numero = endereco.numero;
                updates.endereco_bairro = endereco.bairro;
                updates.endereco_cidade = endereco.cidade;
                updates.endereco_estado = endereco.estado;
                updates.endereco_cep = endereco.cep;
            }
            if (telefone) updates.telefone = telefone;
            if (servicosEssenciais) updates.servicos_essenciais = servicosEssenciais;
            if (servicosAmpliados) updates.servicos_ampliados = servicosAmpliados;

            if (cnes) {
                const {data: existing} = await supabase
                    .from('unidade_saude')
                    .select('id')
                    .eq('cnes', cnes)
                    .neq('id', id);
                if (existing && existing.length > 0) {
                    throw new Error('CNES já cadastrado');
                }
            }

            const {data: existingUnit} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', id)
                .single();
            if (!existingUnit) {
                throw new Error('Unidade de saúde não encontrada');
            }

            const {data, error} = await supabase
                .from('unidade_saude')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error || !data) {
                return {data: null, error: new Error('Erro ao atualizar unidade')};
            }

            const enderecoReturn: Endereco = {
                logradouro: data.endereco_logradouro,
                numero: data.endereco_numero,
                bairro: data.endereco_bairro,
                cidade: data.endereco_cidade,
                estado: data.endereco_estado,
                cep: data.endereco_cep,
            };
            return {
                data: new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, enderecoReturn, data.telefone, data.servicos_essenciais, data.servicos_ampliados),
                error: null
            };
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteUnidadeSaude(id: string, adminId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar unidades');
            }

            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', id)
                .single();
            if (!unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            const {data: consultas} = await supabase
                .from('consulta')
                .select('id')
                .eq('unidade_saude_id', id);
            if (consultas && consultas.length > 0) {
                throw new Error('Unidade possui consultas associadas e não pode ser deletada');
            }

            const {error} = await supabase
                .from('unidade_saude')
                .delete()
                .eq('id', id);

            if (error) throw new Error(`Erro ao deletar unidade: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listFuncionariosByUnidade(unidadeSaudeId: string, adminId: string): Promise<{
        data: Array<Medico | Enfermeiro>,
        error: Error | null
    }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar funcionários');
            }

            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', unidadeSaudeId)
                .single();
            if (!unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            const {data: funcionarioUnidades, error: linkError} = await supabase
                .from('funcionario_unidade')
                .select('funcionario_id')
                .eq('unidade_saude_id', unidadeSaudeId);

            if (linkError || !funcionarioUnidades) {
                throw new Error(`Erro ao buscar funcionários: ${linkError?.message || 'Nenhum funcionário encontrado'}`);
            }

            const funcionarioIds = funcionarioUnidades.map(fu => fu.funcionario_id);

            const {data, error} = await supabase
                .from('funcionario')
                .select('id, nome, papel, crm, coren, data_contratacao, cpf, cns, data_nascimento, sexo, raca_cor, escolaridade, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, telefone, email')
                .in('id', funcionarioIds)
                .in('papel', [Papeis.MEDICO, Papeis.ENFERMEIRO]);

            if (error) throw new Error(`Erro ao listar funcionários: ${error.message}`);

            const funcionarios = data.map((d: any) => {
                const endereco: Endereco = {
                    logradouro: d.endereco_logradouro,
                    numero: d.endereco_numero,
                    bairro: d.endereco_bairro,
                    cidade: d.endereco_cidade,
                    estado: d.endereco_estado,
                    cep: d.endereco_cep,
                };
                if (d.papel === Papeis.MEDICO) {
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
                        d.grupos_risco || [],
                        d.consentimento_lgpd,
                        new Date(d.data_contratacao),
                        d.crm,
                        d.email
                    );
                } else if (d.papel === Papeis.ENFERMEIRO) {
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
                        d.grupos_risco || [],
                        d.consentimento_lgpd,
                        new Date(d.data_contratacao),
                        d.coren,
                        d.email
                    );
                } else {
                    throw new Error(`Papel inválido: ${d.papel}`);
                }
            });
            return {data: funcionarios, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async associarFuncionarioUnidade(
        unidadeSaudeId: string,
        funcionarioId: string,
        adminId: string
    ): Promise<{ data: boolean; error: Error | null }> {
        try {
            // 1. Valida admin
            const { data: admin } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .single();

            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode associar funcionários a unidades');
            }

            // 2. Valida funcionário
            const { data: funcionario } = await supabase
                .from('funcionario')
                .select('id')
                .eq('id', funcionarioId)
                .single();

            if (!funcionario) {
                throw new Error('Funcionário não encontrado');
            }

            // 3. Valida unidade destino
            const { data: unidade } = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', unidadeSaudeId)
                .single();

            if (!unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            // 4. Remove vínculo atual (SE EXISTIR)
            const { error: deleteError } = await supabase
                .from('funcionario_unidade')
                .delete()
                .eq('funcionario_id', funcionarioId);

            if (deleteError) {
                throw new Error(`Erro ao remover vínculo anterior: ${deleteError.message}`);
            }

            // 5. Cria novo vínculo
            const { error: insertError } = await supabase
                .from('funcionario_unidade')
                .insert({
                    funcionario_id: funcionarioId,
                    unidade_saude_id: unidadeSaudeId
                });

            if (insertError) {
                throw new Error(`Erro ao associar funcionário à nova unidade: ${insertError.message}`);
            }

            return { data: true, error: null };
        } catch (error) {
            return {
                data: false,
                error: error instanceof Error ? error : new Error('Erro desconhecido')
            };
        }
    }
}