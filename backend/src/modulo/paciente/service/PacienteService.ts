import {supabaseClient} from '../../../shared/database/supabase';
import {Paciente} from '../model/Paciente';

export class PacienteService {
    /**
     * Cadastra um novo paciente.
     */
    static async criar(paciente: Omit<Paciente, 'id' | 'criado_em' | 'atualizado_em'>): Promise<Paciente> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .insert([paciente])
            .select('*')
            .single();

        if (error || !data) {
            throw new Error('Erro ao cadastrar paciente: ' + error?.message);
        }

        return data as Paciente;
    }

    /**
     * Atualiza dados do paciente.
     */
    static async atualizar(id: number, updates: Partial<Omit<Paciente, 'id' | 'criado_em'>>): Promise<Paciente> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .update({...updates, atualizado_em: new Date().toISOString()})
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) {
            throw new Error('Erro ao atualizar paciente: ' + error?.message);
        }

        return data as Paciente;
    }

    /**
     * Busca paciente por ID.
     */
    static async buscarPorId(id: number): Promise<Paciente> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new Error('Paciente não encontrado: ' + error?.message);
        }

        return data as Paciente;
    }

    /**
     * Busca paciente por CPF.
     */
    static async buscarPorCPF(cpf: string): Promise<Paciente | null> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('cpf', cpf)
            .maybeSingle();

        if (error) throw new Error('Erro ao buscar por CPF: ' + error.message);
        return data as Paciente | null;
    }

    /**
     * Busca paciente por número do Cartão SUS.
     */
    static async buscarPorCartaoSUS(cartao_sus: string): Promise<Paciente | null> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('cartao_sus', cartao_sus)
            .maybeSingle();

        if (error) throw new Error('Erro ao buscar por Cartão SUS: ' + error.message);
        return data as Paciente | null;
    }

    /**
     * Lista todos os pacientes.
     */
    static async listarTodos(): Promise<Paciente[]> {
        const {data, error} = await supabaseClient
            .from('pacientes')
            .select('*');

        if (error) {
            throw new Error('Erro ao listar pacientes: ' + error.message);
        }

        return data as Paciente[];
    }

    /**
     * Exclui paciente (remoção lógica ou física, conforme política futura).
     */
    static async excluir(id: number): Promise<void> {
        const {error} = await supabaseClient
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error('Erro ao excluir paciente: ' + error.message);
        }
    }
}
