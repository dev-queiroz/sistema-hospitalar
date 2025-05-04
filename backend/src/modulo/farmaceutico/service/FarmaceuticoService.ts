import {supabaseClient} from '../../../shared/database/supabase';
import {Funcionario} from '../../funcionario/model/Funcionario';

export class FuncionarioService {
    /**
     * Cria um novo funcionário (já vinculado a uma unidade).
     */
    static async criar(funcionario: Omit<Funcionario, 'id' | 'criado_em' | 'atualizado_em'>): Promise<Funcionario> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .insert([funcionario])
            .select('*')
            .single();

        if (error || !data) {
            throw new Error('Erro ao criar funcionário: ' + error?.message);
        }

        return data as Funcionario;
    }

    /**
     * Atualiza os dados de um funcionário.
     */
    static async atualizar(id: number, updates: Partial<Omit<Funcionario, 'id' | 'criado_em'>>): Promise<Funcionario> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .update({...updates, atualizado_em: new Date().toISOString()})
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) {
            throw new Error('Erro ao atualizar funcionário: ' + error?.message);
        }

        return data as Funcionario;
    }

    /**
     * Realoca um funcionário para outra unidade.
     */
    static async realocar(id: number, novaUnidadeId: number): Promise<Funcionario> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .update({unidade_id: novaUnidadeId, atualizado_em: new Date().toISOString()})
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) {
            throw new Error('Erro ao realocar funcionário: ' + error?.message);
        }

        return data as Funcionario;
    }

    /**
     * Busca funcionário por ID.
     */
    static async buscarPorId(id: number): Promise<Funcionario | null> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error('Funcionário não encontrado: ' + error?.message);
        }

        return data as Funcionario;
    }

    /**
     * Lista todos os funcionários.
     */
    static async listarTodos(): Promise<Funcionario[]> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .select('*');

        if (error) {
            throw new Error('Erro ao listar funcionários: ' + error?.message);
        }

        return data as Funcionario[];
    }

    /**
     * Lista funcionários por unidade de saúde.
     */
    static async listarPorUnidade(unidadeId: number): Promise<Funcionario[]> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .select('*')
            .eq('unidade_id', unidadeId);

        if (error) {
            throw new Error('Erro ao listar funcionários da unidade: ' + error?.message);
        }

        return data as Funcionario[];
    }

    /**
     * Deleta (ou desativa) um funcionário.
     */
    static async excluir(id: number): Promise<void> {
        const {error} = await supabaseClient
            .from('funcionarios')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error('Erro ao excluir funcionário: ' + error?.message);
        }
    }

    /**
     * Verifica se o CPF já está vinculado a um funcionário.
     */
    static async cpfExiste(cpf: string): Promise<boolean> {
        const {data, error} = await supabaseClient
            .from('funcionarios')
            .select('id')
            .eq('cpf', cpf)
            .maybeSingle();

        if (error) throw new Error('Erro ao verificar CPF: ' + error.message);
        return !!data;
    }
}
