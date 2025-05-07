import {supabaseClient} from '../../../shared/database/supabase';
import {UnidadeSaude} from '../model/UnidadeSaude';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

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
        // Validações
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
        if (!usuario && usuarioId !== 'PACIENTE') {
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

        const {error} = await supabase
            .from('unidade_saude')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar unidade: ${error.message}`);
        return true;
    }

    async listUnidadesSaude(usuarioId: string): Promise<UnidadeSaude[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario && usuarioId !== 'PACIENTE') {
            throw new Error('Usuário inválido');
        }

        const {data, error} = await supabase
            .from('unidade_saude')
            .select('*')
            .limit(100);

        if (error) throw new Error(`Erro ao listar unidades: ${error.message}`);
        return data.map((d: any) => new UnidadeSaude(d.id, d.nome, d.tipo, d.cnes, d.endereco, d.telefone, d.servicos_essenciais, d.servicos_ampliados));
    }
}