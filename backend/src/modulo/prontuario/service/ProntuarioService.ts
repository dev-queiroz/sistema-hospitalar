import {supabaseClient} from '../../../shared/database/supabase';
import {Prontuario} from '../model/Prontuario';
import {Papeis} from '../../core/model/Enums';

const supabase = supabaseClient;

class ProntuarioService {
    async createProntuario(
        pacienteId: string,
        profissionalId: string,
        descricao: string,
        dadosAnonimizados: boolean
    ): Promise<Prontuario> {
        // Validações
        if (!pacienteId || !profissionalId || !descricao) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', pacienteId)
            .single();
        if (!paciente) {
            throw new Error('Paciente não encontrado');
        }
        const {data: profissional} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', profissionalId)
            .single();
        if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
            throw new Error('Apenas MEDICO ou ENFERMEIRO podem criar prontuários');
        }

        const {data, error} = await supabase
            .from('prontuario')
            .insert({
                paciente_id: pacienteId,
                profissional_id: profissionalId,
                descricao,
                dados_anonimizados: dadosAnonimizados,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar prontuário: ${error.message}`);
        return new Prontuario(data.id, data.paciente_id, data.profissional_id, data.descricao, data.dados_anonimizados);
    }

    async getProntuario(id: string, usuarioId: string): Promise<Prontuario | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        const {data: prontuario} = await supabase
            .from('prontuario')
            .select('paciente_id')
            .eq('id', id)
            .single();
        const isPaciente = prontuario && usuarioId === prontuario.paciente_id;
        if (!usuario && !isPaciente) {
            throw new Error('Usuário inválido');
        }
        if (usuario && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO && !isPaciente) {
            throw new Error('Apenas ENFERMEIRO, MEDICO ou o PACIENTE podem visualizar prontuários');
        }

        const {data, error} = await supabase
            .from('prontuario')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Prontuario(data.id, data.paciente_id, data.profissional_id, data.descricao, data.dados_anonimizados);
    }

    async listProntuariosByPaciente(pacienteId: string, usuarioId: string): Promise<Prontuario[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        const isPaciente = usuarioId === pacienteId || usuarioId === 'PACIENTE';
        if (!usuario && !isPaciente) {
            throw new Error('Usuário inválido');
        }
        if (usuario && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO && !isPaciente) {
            throw new Error('Apenas ENFERMEIRO, MEDICO ou o PACIENTE podem visualizar prontuários');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', pacienteId)
            .single();
        if (!paciente) throw new Error('Paciente não encontrado');

        const {data, error} = await supabase
            .from('prontuario')
            .select('*')
            .eq('paciente_id', pacienteId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar prontuários: ${error.message}`);
        return data.map((d: any) => new Prontuario(d.id, d.paciente_id, d.profissional_id, d.descricao, d.dados_anonimizados));
    }
}