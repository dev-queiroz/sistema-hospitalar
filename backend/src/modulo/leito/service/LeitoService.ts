import {supabaseClient} from '../../../shared/database/supabase';
import {Leito} from '../model/Leito';
import {Papeis} from '../../core/model/Enums';

const supabase = supabaseClient;

class LeitoService {
    async createLeito(numero: string, quartoId: string, adminId: string): Promise<Leito> {
        // Validações
        if (!numero || !quartoId) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        const {data: quarto} = await supabase
            .from('quarto')
            .select('id, unidade_saude_id')
            .eq('id', quartoId)
            .single();
        if (!quarto) {
            throw new Error('Quarto não encontrado');
        }
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar leitos');
        }

        // Verificar unicidade
        const {data: existing} = await supabase
            .from('leito')
            .select('id')
            .eq('numero', numero)
            .eq('quarto_id', quartoId);
        if (existing && existing.length > 0) {
            throw new Error('Leito com este número já existe no quarto');
        }

        const {data, error} = await supabase
            .from('leito')
            .insert({
                numero,
                quarto_id: quartoId,
                disponivel: true,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar leito: ${error.message}`);
        return new Leito(data.id, data.numero, data.quarto_id);
    }

    async getLeito(id: string, usuarioId: string): Promise<Leito | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario) {
            throw new Error('Usuário inválido');
        }

        const {data, error} = await supabase
            .from('leito')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Leito(data.id, data.numero, data.quarto_id);
    }

    async updateLeito(id: string, numero?: string, disponivel?: boolean, adminId?: string): Promise<Leito | null> {
        if (!adminId) throw new Error('ID do administrador é obrigatório');
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar leitos');
        }

        const updates: any = {};
        if (numero) updates.numero = numero;
        if (disponivel !== undefined) updates.disponivel = disponivel;

        // Verificar unicidade
        if (numero) {
            const {data: leito} = await supabase
                .from('leito')
                .select('quarto_id')
                .eq('id', id)
                .single();
            if (!leito) throw new Error('Leito não encontrado');
            const {data: existing} = await supabase
                .from('leito')
                .select('id')
                .eq('numero', numero)
                .eq('quarto_id', leito.quarto_id)
                .neq('id', id);
            if (existing && existing.length > 0) {
                throw new Error('Leito com este número já existe no quarto');
            }
        }

        const {data, error} = await supabase
            .from('leito')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new Leito(data.id, data.numero, data.quarto_id);
    }

    async deleteLeito(id: string, adminId: string): Promise<boolean> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar leitos');
        }

        const {error} = await supabase
            .from('leito')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar leito: ${error.message}`);
        return true;
    }

    async listLeitosByQuarto(quartoId: string, usuarioId: string): Promise<Leito[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario) {
            throw new Error('Usuário inválido');
        }

        const {data: quarto} = await supabase
            .from('quarto')
            .select('id')
            .eq('id', quartoId)
            .single();
        if (!quarto) throw new Error('Quarto não encontrado');

        const {data, error} = await supabase
            .from('leito')
            .select('*')
            .eq('quarto_id', quartoId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar leitos: ${error.message}`);
        return data.map((d: any) => new Leito(d.id, d.numero, d.quarto_id));
    }

    async listLeitosDisponiveis(quartoId: string, usuarioId: string): Promise<Leito[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && usuario.papel !== Papeis.ENFERMEIRO)) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL ou ENFERMEIRO podem listar leitos disponíveis');
        }

        const {data: quarto} = await supabase
            .from('quarto')
            .select('id')
            .eq('id', quartoId)
            .single();
        if (!quarto) throw new Error('Quarto não encontrado');

        const {data, error} = await supabase
            .from('leito')
            .select('*')
            .eq('quarto_id', quartoId)
            .eq('disponivel', true)
            .limit(100);

        if (error) throw new Error(`Erro ao listar leitos disponíveis: ${error.message}`);
        return data.map((d: any) => new Leito(d.id, d.numero, d.quarto_id));
    }
}