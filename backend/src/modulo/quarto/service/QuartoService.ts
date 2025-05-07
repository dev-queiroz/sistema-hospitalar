import {supabaseClient} from '../../../shared/database/supabase';
import {Quarto} from '../model/Quarto';
import {Papeis} from '../../core/model/Enums';

const supabase = supabaseClient;

class QuartoService {
    async createQuarto(numero: string, unidadeSaudeId: string, adminId: string): Promise<Quarto> {
        // Validações
        if (!numero || !unidadeSaudeId) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        const {data: unidade} = await supabase
            .from('unidade_saude')
            .select('id')
            .eq('id', unidadeSaudeId)
            .single();
        if (!unidade) {
            throw new Error('Unidade de saúde não encontrada');
        }
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar quartos');
        }

        // Verificar unicidade
        const {data: existing} = await supabase
            .from('quarto')
            .select('id')
            .eq('numero', numero)
            .eq('unidade_saude_id', unidadeSaudeId);
        if (existing && existing.length > 0) {
            throw new Error('Quarto com este número já existe na unidade');
        }

        const {data, error} = await supabase
            .from('quarto')
            .insert({
                numero,
                unidade_saude_id: unidadeSaudeId,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar quarto: ${error.message}`);
        return new Quarto(data.id, data.numero, data.unidade_saude_id);
    }

    async getQuarto(id: string, usuarioId: string): Promise<Quarto | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario) {
            throw new Error('Usuário inválido');
        }

        const {data, error} = await supabase
            .from('quarto')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Quarto(data.id, data.numero, data.unidade_saude_id);
    }

    async updateQuarto(id: string, numero?: string, adminId?: string): Promise<Quarto | null> {
        if (!adminId) throw new Error('ID do administrador é obrigatório');
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar quartos');
        }

        const updates: any = {};
        if (numero) updates.numero = numero;

        // Verificar unicidade
        if (numero) {
            const {data: quarto} = await supabase
                .from('quarto')
                .select('unidade_saude_id')
                .eq('id', id)
                .single();
            if (!quarto) throw new Error('Quarto não encontrado');
            const {data: existing} = await supabase
                .from('quarto')
                .select('id')
                .eq('numero', numero)
                .eq('unidade_saude_id', quarto.unidade_saude_id)
                .neq('id', id);
            if (existing && existing.length > 0) {
                throw new Error('Quarto com este número já existe na unidade');
            }
        }

        const {data, error} = await supabase
            .from('quarto')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new Quarto(data.id, data.numero, data.unidade_saude_id);
    }

    async deleteQuarto(id: string, adminId: string): Promise<boolean> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar quartos');
        }

        // Verificar se há leitos associados
        const {data: leitos} = await supabase
            .from('leito')
            .select('id')
            .eq('quarto_id', id);
        if (leitos && leitos.length > 0) {
            throw new Error('Não é possível deletar quarto com leitos associados');
        }

        const {error} = await supabase
            .from('quarto')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar quarto: ${error.message}`);
        return true;
    }

    async listQuartosByUnidade(unidadeSaudeId: string, usuarioId: string): Promise<Quarto[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario) {
            throw new Error('Usuário inválido');
        }

        const {data: unidade} = await supabase
            .from('unidade_saude')
            .select('id')
            .eq('id', unidadeSaudeId)
            .single();
        if (!unidade) throw new Error('Unidade de saúde não encontrada');

        const {data, error} = await supabase
            .from('quarto')
            .select('*')
            .eq('unidade_saude_id', unidadeSaudeId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar quartos: ${error.message}`);
        return data.map((d: any) => new Quarto(d.id, d.numero, d.unidade_saude_id));
    }
}