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
    ): Promise<UnidadeSaude> {
        if (!nome || !tipo || !cnes || !endereco || !telefone || !servicosEssenciais) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        if (!/^\d{7}$/.test(cnes)) {
            throw new Error('CNES inválido (deve ter 7 dígitos)');
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
                endereco,
                telefone,
                servicos_essenciais: servicosEssenciais,
                servicos_ampliados: servicosAmpliados,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar unidade: ${error.message}`);
        return new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, data.endereco, data.telefone, data.servicos_essenciais, data.servicos_ampliados);
    }

    async getUnidadeSaude(id: string, usuarioId: string): Promise<UnidadeSaude | null> {
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

        if (error || !data) return null;
        return new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, data.endereco, data.telefone, data.servicos_essenciais, data.servicos_ampliados);
    }

    async listUnidadesSaude(adminId: string): Promise<Array<UnidadeSaude>> {
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
        return data.map((d: any) => new UnidadeSaude(d.id, d.nome, d.tipo, d.cnes, d.endereco, d.telefone, d.servicos_essenciais, d.servicos_ampliados));
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
    ): Promise<UnidadeSaude | null> {
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

        const updates: any = {};
        if (nome) updates.nome = nome;
        if (tipo) updates.tipo = tipo;
        if (cnes) updates.cnes = cnes;
        if (endereco) updates.endereco = endereco;
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

        const {data, error} = await supabase
            .from('unidade_saude')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new UnidadeSaude(data.id, data.nome, data.tipo, data.cnes, data.endereco, data.telefone, data.servicos_essenciais, data.servicos_ampliados);
    }

    async deleteUnidadeSaude(id: string, adminId: string): Promise<boolean> {
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
        if (!unidade) throw new Error('Unidade de saúde não encontrada');

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
        return true;
    }

    async listFuncionariosByUnidade(unidadeSaudeId: string, adminId: string): Promise<Array<Medico | Enfermeiro>> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar funcionários por unidade');
        }

        const {data: unidade} = await supabase
            .from('unidade_saude')
            .select('id')
            .eq('id', unidadeSaudeId)
            .single();
        if (!unidade) throw new Error('Unidade de saúde não encontrada');

        // Busca funcionários que realizaram consultas ou triagens na unidade
        const {data: consultas} = await supabase
            .from('consulta')
            .select('profissional_id')
            .eq('unidade_saude_id', unidadeSaudeId);
        const {data: triagens} = await supabase
            .from('triagem')
            .select('enfermeiro_id')
            .eq('unidade_saude_id', unidadeSaudeId);

        const funcionarioIds = [
            ...new Set([
                ...(consultas?.map((c: any) => c.profissional_id) || []),
                ...(triagens?.map((t: any) => t.enfermeiro_id) || []),
            ]),
        ];

        const {data, error} = await supabase
            .from('funcionario')
            .select('id, nome, papel, crm, coren, data_contratacao, cpf, cns, data_nascimento, sexo, raca_cor, escolaridade, endereco, telefone, email')
            .in('id', funcionarioIds)
            .limit(100);

        if (error) throw new Error(`Erro ao listar funcionários: ${error.message}`);

        return data.map((d: any) => {
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
                    d.endereco,
                    d.telefone,
                    d.grupos_risco,
                    d.consentimento_lgpd,
                    d.data_contratacao,
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
                    d.endereco,
                    d.telefone,
                    d.grupos_risco,
                    d.consentimento_lgpd,
                    d.data_contratacao,
                    d.coren,
                    d.email
                );
            } else {
                throw new Error(`Papel inválido para funcionário: ${d.papel}`);
            }
        });
    }
}