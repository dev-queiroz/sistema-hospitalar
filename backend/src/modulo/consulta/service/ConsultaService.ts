import {supabaseClient} from '../../../shared/database/supabase';
import {Consulta} from '../model/Consulta';
import {ProntuarioService} from '../../prontuario/service/ProntuarioService';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';

const supabase = supabaseClient;

export class ConsultaService {
    private prontuarioService: ProntuarioService;

    constructor() {
        this.prontuarioService = new ProntuarioService();
    }

    async createConsulta(
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        observacoes: string,
        cid10?: string
    ): Promise<{ data: Consulta | null, error: Error | null }> {
        try {
            if (!pacienteId || !profissionalId || !unidadeSaudeId || !observacoes) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (observacoes.length < 10) {
                throw new Error('Observações devem ter pelo menos 10 caracteres');
            }
            if (cid10 && !/^[A-Z]\d{2}(\.\d{1,2})?$/.test(cid10)) {
                throw new Error('CID-10 inválido (ex.: J45 ou J45.0)');
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
                .select('id, tipo')
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
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO ou ADMINISTRADOR_PRINCIPAL podem criar consultas');
            }
            if (profissional.papel === Papeis.ENFERMEIRO && unidade.tipo !== TipoUnidadeSaude.UPA) {
                throw new Error('ENFERMEIRO só pode criar consultas em UPAs');
            }

            const {data, error} = await supabase
                .from('consulta')
                .insert({
                    paciente_id: pacienteId,
                    profissional_id: profissionalId,
                    unidade_saude_id: unidadeSaudeId,
                    observacoes,
                    cid10,
                    data_consulta: new Date().toISOString(),
                    ativo: true,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar consulta: ${error.message}`);

            // Criar entrada no prontuário
            const prontuarioDescricao = `Consulta realizada em ${new Date().toLocaleDateString('pt-BR')}. Observações: ${observacoes}${cid10 ? `. CID-10: ${cid10}` : ''}`;
            const {data: prontuario, error: prontuarioError} = await this.prontuarioService.createProntuario(
                pacienteId,
                profissionalId,
                unidadeSaudeId,
                prontuarioDescricao,
                cid10 ? {cid10} : {}
            );
            if (prontuarioError || !prontuario) {
                throw new Error(`Erro ao criar entrada no prontuário: ${prontuarioError?.message || 'Erro desconhecido'}`);
            }

            const consulta = new Consulta(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.observacoes,
                data.cid10,
                data.data_consulta
            );
            return {data: consulta, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getAllConsultas(usuarioId: string): Promise<{ data: Consulta[], error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar todas as consultas');
            }

            const {data, error} = await supabase
                .from('consulta')
                .select('*')
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);

            const consultas = data.map((d: any) => new Consulta(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.observacoes,
                d.cid10,
                d.data_consulta
            ));
            return {data: consultas, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getConsulta(id: string, usuarioId: string): Promise<{ data: Consulta | null, error: Error | null }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar consultas');
            }

            const {data, error} = await supabase
                .from('consulta')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) return {data: null, error: new Error('Consulta não encontrada')};

            const consulta = new Consulta(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.observacoes,
                data.cid10,
                data.data_consulta
            );
            return {data: consulta, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listConsultasByPaciente(pacienteId: string, usuarioId: string): Promise<{
        data: Consulta[],
        error: Error | null
    }> {
        try {
            const {data: usuario} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();
            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem visualizar consultas por paciente');
            }

            const {data: paciente} = await supabase
                .from('paciente')
                .select('id')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();
            if (!paciente) throw new Error('Paciente não encontrado');

            const {data, error} = await supabase
                .from('consulta')
                .select('*')
                .eq('paciente_id', pacienteId)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);

            const consultas = data.map((d: any) => new Consulta(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.observacoes,
                d.cid10,
                d.data_consulta
            ));
            return {data: consultas, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listConsultasByProfissional(profissionalId: string, adminId: string): Promise<{
        data: Consulta[],
        error: Error | null
    }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .eq('ativo', true)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar consultas por profissional');
            }

            const {data: profissional} = await supabase
                .from('funcionario')
                .select('id')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional) throw new Error('Profissional não encontrado');

            const {data, error} = await supabase
                .from('consulta')
                .select('*')
                .eq('profissional_id', profissionalId)
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);

            const consultas = data.map((d: any) => new Consulta(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.observacoes,
                d.cid10,
                d.data_consulta
            ));
            return {data: consultas, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listAtendimentosAtivos(unidadeSaudeId: string, adminId: string): Promise<{
        data: Consulta[],
        error: Error | null
    }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .eq('ativo', true)
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
                .eq('ativo', true)
                .gte('data_consulta', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(100);

            if (error) throw new Error(`Erro ao listar atendimentos ativos: ${error.message}`);

            const consultas = data.map((d: any) => new Consulta(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.observacoes,
                d.cid10,
                d.data_consulta
            ));
            return {data: consultas, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async listConsultasByUnidadeSaude(unidadeSaudeId: string, adminId: string): Promise<{
        data: Consulta[],
        error: Error | null
    }> {
        try {
            const {data: admin} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', adminId)
                .eq('ativo', true)
                .single();
            if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar consultas por unidade');
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
                .eq('ativo', true)
                .limit(100);

            if (error) throw new Error(`Erro ao listar consultas: ${error.message}`);

            const consultas = data.map((d: any) => new Consulta(
                d.id,
                d.paciente_id,
                d.profissional_id,
                d.unidade_saude_id,
                d.observacoes,
                d.cid10,
                d.data_consulta
            ));
            return {data: consultas, error: null};
        } catch (error) {
            return {data: [], error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async updateConsulta(
        id: string,
        observacoes?: string,
        cid10?: string,
        profissionalId?: string
    ): Promise<{ data: Consulta | null, error: Error | null }> {
        try {
            if (!profissionalId) throw new Error('ID do profissional é obrigatório');
            if (observacoes && observacoes.length < 10) {
                throw new Error('Observações devem ter pelo menos 10 caracteres');
            }
            if (cid10 && !/^[A-Z]\d{2}(\.\d{1,2})?$/.test(cid10)) {
                throw new Error('CID-10 inválido (ex.: J45 ou J45.0)');
            }

            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || profissional.papel !== Papeis.MEDICO) {
                throw new Error('Apenas MEDICO pode atualizar consultas');
            }

            const {data: consulta} = await supabase
                .from('consulta')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!consulta) throw new Error('Consulta não encontrada');

            const updates: any = {};
            if (observacoes) updates.observacoes = observacoes;
            if (cid10 !== undefined) updates.cid10 = cid10;

            const {data, error} = await supabase
                .from('consulta')
                .update(updates)
                .eq('id', id)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) return {data: null, error: new Error('Consulta não encontrada')};

            // Criar entrada no prontuário
            if (observacoes || cid10) {
                const prontuarioDescricao = `Consulta atualizada em ${new Date().toLocaleDateString('pt-BR')}. Observações: ${observacoes || consulta.observacoes}${cid10 ? `. CID-10: ${cid10}` : ''}`;
                const {data: prontuario, error: prontuarioError} = await this.prontuarioService.createProntuario(
                    consulta.paciente_id,
                    profissionalId,
                    consulta.unidade_saude_id,
                    prontuarioDescricao,
                    cid10 ? {cid10} : {}
                );
                if (prontuarioError || !prontuario) {
                    throw new Error(`Erro ao criar entrada no prontuário: ${prontuarioError?.message || 'Erro desconhecido'}`);
                }
            }

            const consultaAtualizada = new Consulta(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.observacoes,
                data.cid10,
                data.data_consulta
            );
            return {data: consultaAtualizada, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deleteConsulta(id: string, profissionalId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || profissional.papel !== Papeis.MEDICO) {
                throw new Error('Apenas MEDICO pode desativar consultas');
            }

            const {data: consulta} = await supabase
                .from('consulta')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!consulta) throw new Error('Consulta não encontrada');

            const {error} = await supabase
                .from('consulta')
                .update({ativo: false, data_desativacao: new Date().toISOString()})
                .eq('id', id);

            if (error) throw new Error(`Erro ao desativar consulta: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}