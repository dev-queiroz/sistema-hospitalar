import {supabaseClient} from '../../../shared/database/supabase';
import {Consulta} from '../model/Consulta';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';

const supabase = supabaseClient;

class ConsultaService {
    async createConsulta(
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        observacoes: string,
        quartoId?: string,
        cid10?: string
    ): Promise<Consulta> {
        // Validações
        if (!pacienteId || !profissionalId || !unidadeSaudeId || !observacoes) {
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
            .single();
        if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
            throw new Error('Apenas MEDICO ou ENFERMEIRO podem criar consultas');
        }
        if (profissional.papel === Papeis.ENFERMEIRO) {
            // Verificar se é em UPA
            const {data: unidade} = await supabase
                .from('unidade_saude')
                .select('tipo')
                .eq('id', unidadeSaudeId)
                .single();
            if (unidade!.tipo !== TipoUnidadeSaude.UPA) {
                throw new Error('ENFERMEIRO só pode criar consultas em UPAs');
            }
        }
        if (quartoId) {
            const {data: quarto} = await supabase
                .from('quarto')
                .select('id')
                .eq('id', quartoId)
                .eq('unidade_saude_id', unidadeSaudeId)
                .single();
            if (!quarto) {
                throw new Error('Quarto inválido ou não pertence à unidade');
            }
        }

        const {data, error} = await supabase
            .from('consulta')
            .insert({
                paciente_id: pacienteId,
                profissional_id: profissionalId,
                unidade_saude_id: unidadeSaudeId,
                observacoes,
                quarto_id: quartoId,
                cid10,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar consulta: ${error.message}`);
        return new Consulta(data.id, data.paciente_id, data.profissional_id, data.unidade_saude_id, data.observacoes, data.quarto_id, data.cid10);
    }

    async getConsulta(id: string, usuarioId: string): Promise<Consulta | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        const {data: consulta} = await supabase
            .from('consulta')
            .select('paciente_id')
            .eq('id', id)
            .single();
        const isPaciente = consulta && usuarioId === consulta.paciente_id;
        if (!usuario && !isPaciente) {
            throw new Error('Usuário inválido');
        }
        if (usuario && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && !isPaciente) {
            throw new Error('Apenas ENFERMEIRO, MEDICO, ADMINISTRADOR_PRINCIPAL ou o PACIENTE podem visualizar consultas');
        }

        const {data, error} = await supabase
            .from('consulta')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Consulta(data.id, data.paciente_id, data.profissional_id, data.unidade_saude_id, data.observacoes, data.quarto_id, data.cid10);
    }

    async listConsultasByPaciente(pacienteId: string, usuarioId: string): Promise<Consulta[]> {
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
            throw new Error('Apenas ENFERMEIRO, MEDICO ou o PACIENTE podem visualizar consultas');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', pacienteId)
            .single();
        if (!paciente) throw new Error('Paciente não encontrado');

        const {data, error} = await supabase
            .from('consulta')
            .select('*')
            .eq('paciente_id', pacienteId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);
        return data.map((d: any) => new Consulta(d.id, d.paciente_id, d.profissional_id, d.unidade_saude_id, d.observacoes, d.quarto_id, d.cid10));
    }

    async listConsultasByProfissional(profissionalId: string, adminId: string): Promise<Consulta[]> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar consultas por profissional');
        }

        const {data: profissional} = await supabase
            .from('funcionario')
            .select('id')
            .eq('id', profissionalId)
            .single();
        if (!profissional) throw new Error('Profissional não encontrado');

        const {data, error} = await supabase
            .from('consulta')
            .select('*')
            .eq('profissional_id', profissionalId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);
        return data.map((d: any) => new Consulta(d.id, d.paciente_id, d.profissional_id, d.unidade_saude_id, d.observacoes, d.quarto_id, d.cid10));
    }

    async listAtendimentosAtivos(unidadeSaudeId: string, adminId: string): Promise<Consulta[]> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar atendimentos ativos');
        }

        const {data: unidade} = await supabase
            .from('unidade_saude')
            .select('id')
            .eq('id', unidadeSaudeId)
            .single();
        if (!unidade) throw new Error('Unidade de saúde não encontrada');

        const {data, error} = await supabase
            .from('consulta')
            .select('*')
            .eq('unidade_saude_id', unidadeSaudeId)
            .gte('data', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
            .limit(100);

        if (error) throw new Error(`Erro ao listar atendimentos ativos: ${error.message}`);
        return data.map((d: any) => new Consulta(d.id, d.paciente_id, d.profissional_id, d.unidade_saude_id, d.observacoes, d.quarto_id, d.cid10));
    }
}