import {supabaseClient} from '../../../shared/database/supabase';
import {Prontuario} from '../model/Prontuario';
import {Papeis} from '../../core/model/Enums';

const supabase = supabaseClient;

export class ProntuarioService {
    async createProntuario(
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        descricao: string,
        dadosAnonimizados?: Record<string, string>
    ): Promise<{ data: Prontuario | null, error: Error | null }> {
        try {
            if (!pacienteId || !profissionalId || !unidadeSaudeId || !descricao) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (descricao.length < 10) {
                throw new Error('Descrição deve ter pelo menos 10 caracteres');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();
            if (!paciente) {
                throw new Error('Paciente não encontrado');
            }

            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('id')
                .eq('id', unidadeSaudeId)
                .single();
            if (!unidade) {
                throw new Error('Unidade de saúde não encontrada');
            }

            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem criar prontuários');
            }

            const {data, error} = await supabase
                .from('prontuario')
                .insert({
                    paciente_id: pacienteId,
                    profissional_id: profissionalId,
                    unidade_saude_id: unidadeSaudeId,
                    descricao,
                    dados_anonimizados: dadosAnonimizados || {},
                    ativo: true,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar prontuário: ${error.message}`);

            const prontuario = new Prontuario(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.descricao,
                data.dados_anonimizados
            );
            return {data: prontuario, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getProntuario(id: string, usuarioId: string): Promise<{ data: Prontuario | null, error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prontuários');
            }

            const {data, error} = await supabase
                .from('prontuario')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) return {data: null, error: new Error('Prontuário não encontrado')};

            const prontuario = new Prontuario(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.descricao,
                data.dados_anonimizados
            );
            return {data: prontuario, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listProntuariosByPaciente(pacienteId: string, usuarioId: string): Promise<{
        data: Prontuario[],
        error: Error | null
    }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prontuários');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();
            if (!paciente) throw new Error('Paciente não encontrado');

            const {data, error} = await supabase
                .from('prontuario')
                .select('*')
                .eq('paciente_id', pacienteId)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar prontuários: ${error.message}`);

            const prontuarios = data.map((d: any) => new Prontuario(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.descricao,
                d.dados_anonimizados
            ));
            return {data: prontuarios, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateProntuario(
        id: string,
        descricao?: string,
        dadosAnonimizados?: Record<string, string>,
        profissionalId?: string
    ): Promise<{ data: Prontuario | null, error: Error | null }> {
        try {
            if (!profissionalId) throw new Error('ID do profissional é obrigatório');
            if (descricao && descricao.length < 10) {
                throw new Error('Descrição deve ter pelo menos 10 caracteres');
            }

            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem atualizar prontuários');
            }

            const {data: prontuario} = await supabase
                .from('prontuario')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!prontuario) throw new Error('Prontuário não encontrado');

            const updates: any = {};
            if (descricao) updates.descricao = descricao;
            if (dadosAnonimizados !== undefined) updates.dados_anonimizados = dadosAnonimizados;

            const {data, error} = await supabase
                .from('prontuario')
                .update(updates)
                .eq('id', id)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) return {data: null, error: new Error('Prontuário não encontrado')};

            const prontuarioAtualizado = new Prontuario(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.descricao,
                data.dados_anonimizados
            );
            return {data: prontuarioAtualizado, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteProntuario(id: string, profissionalId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem desativar prontuários');
            }

            const {data: prontuario} = await supabase
                .from('prontuario')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!prontuario) throw new Error('Prontuário não encontrado');

            const {error} = await supabase
                .from('prontuario')
                .update({ativo: false, data_desativacao: new Date().toISOString()})
                .eq('id', id);

            if (error) throw new Error(`Erro ao desativar prontuário: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}