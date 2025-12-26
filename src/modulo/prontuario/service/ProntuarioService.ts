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
        cid10: string
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

            const payload: Record<string, any> = {
                paciente_id: pacienteId,
                profissional_id: profissionalId,
                unidade_saude_id: unidadeSaudeId,
                descricao,
                cid10: cid10,
                ativo: true,
            };

            console.log('Payload enviado para Supabase:', payload); // DEBUG — remova depois

            const { data, error } = await supabase
                .from('prontuario')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error('Erro do Supabase:', error);
                throw new Error(`Erro ao criar prontuário: ${error.message}`);
            }

            console.log('Dados retornados do Supabase:', data); // DEBUG

            const prontuario = new Prontuario(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.descricao,
                data.cid10
            );

            return { data: prontuario, error: null };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error('Erro desconhecido') };
        }
    }

    async getAllProntuarios(usuarioId: string): Promise<{ data: any[], error: Error | null }> {
        try {
            const { data: usuario } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prontuários');
            }

            const { data, error } = await supabase
                .from('prontuario')
                .select(`
                        *,
                        paciente:paciente_id (nome),
                        profissional:profissional_id (nome)
                    `)
                .eq('ativo', true)
                .order('data_criacao', { ascending: false })
                .limit(100);

            if (error) throw new Error(`Erro ao listar prontuários: ${error.message}`);

            const prontuarios = data.map(d => ({
                id: d.id,
                createdAt: d.data_criacao,
                pacienteId: d.paciente_id,
                profissionalId: d.profissional_id,
                unidadeSaudeId: d.unidade_saude_id,
                data: d.data_criacao,
                descricao: d.descricao,
                cid10: d.cid10,
                paciente_nome: d.paciente?.nome || 'Paciente não encontrado',
                profissional_nome: d.profissional?.nome || 'Profissional não encontrado',
            }));

            return { data: prontuarios, error: null };
        } catch (error) {
            return { data: [], error: error instanceof Error ? error : new Error('Erro desconhecido') };
        }
    }

    async getProntuario(id: string, usuarioId: string): Promise<{ data: any | null, error: Error | null }> {
        try {
            const { data: usuario } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prontuários');
            }

            const { data, error } = await supabase
                .from('prontuario')
                .select(`
                        *,
                        paciente:paciente_id (nome),
                        profissional:profissional_id (nome)
                    `)
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) {
                return { data: null, error: new Error('Prontuário não encontrado') };
            }

            const prontuario = {
                id: data.id,
                createdAt: data.data_criacao,
                pacienteId: data.paciente_id,
                profissionalId: data.profissional_id,
                unidadeSaudeId: data.unidade_saude_id,
                data: data.data_criacao,
                descricao: data.descricao,
                cid10: data.cid10,
                paciente_nome: data.paciente?.nome || 'Paciente não encontrado',
                profissional_nome: data.profissional?.nome || 'Profissional não encontrado',
            };

            return { data: prontuario, error: null };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error('Erro desconhecido') };
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
                d.cid10
            ));
            return {data: prontuarios, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateProntuario(
        id: string,
        descricao?: string,
        cid10?: string,
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
            if (cid10) updates.cid10 = cid10;

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
                data.cid10
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