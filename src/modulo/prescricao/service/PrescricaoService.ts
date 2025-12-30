import {supabaseClient} from '../../../shared/database/supabase';
import {Prescricao} from '../model/Prescricao';
import {ProntuarioService} from '../../prontuario/service/ProntuarioService';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';

const supabase = supabaseClient;

export class PrescricaoService {
    private prontuarioService: ProntuarioService;

    constructor() {
        this.prontuarioService = new ProntuarioService();
    }

    async createPrescricao(
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        detalhesPrescricao: string,
        cid10: string
    ): Promise<{ data: Prescricao | null, error: Error | null }> {
        try {
            if (!pacienteId || !profissionalId || !unidadeSaudeId || !detalhesPrescricao || !cid10) {
                throw new Error('Campos obrigatórios não preenchidos');
            }
            if (detalhesPrescricao.length < 10) {
                throw new Error('Detalhes da prescrição devem ter pelo menos 10 caracteres');
            }
            if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(cid10)) {
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
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO && profissional.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem criar prescrições');
            }
            if (profissional.papel === Papeis.ENFERMEIRO && unidade.tipo !== TipoUnidadeSaude.UPA) {
                throw new Error('ENFERMEIRO só pode criar prescrições em UPAs');
            }

            const {data, error} = await supabase
                .from('prescricao')
                .insert({
                    paciente_id: pacienteId,
                    profissional_id: profissionalId,
                    unidade_saude_id: unidadeSaudeId,
                    detalhes_prescricao: detalhesPrescricao,
                    cid10,
                    data_criacao: new Date().toISOString(),
                    ativo: true,
                })
                .select()
                .single();

            if (error) throw new Error(`Erro ao criar prescrição: ${error.message}`);

            const prontuarioDescricao = `Prescrição criada em ${new Date().toLocaleDateString('pt-BR')}. Detalhes: ${detalhesPrescricao}. CID-10: ${cid10}`;
            const {data: prontuario, error: prontuarioError} = await this.prontuarioService.createProntuario(
                pacienteId,
                profissionalId,
                unidadeSaudeId,
                prontuarioDescricao,
                cid10
            );
            if (prontuarioError || !prontuario) {
                throw new Error(`Erro ao criar entrada no prontuário: ${prontuarioError?.message || 'Erro desconhecido'}`);
            }

            const prescricao = new Prescricao(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.detalhes_prescricao,
                data.cid10,
                data.data_criacao
            );
            return {data: prescricao, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async getAllPrescricoes(usuarioId: string): Promise<{ data: any[], error: Error | null }> {
        try {
            const { data: usuario } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO ou ADMINISTRADOR_PRINCIPAL podem visualizar prescrições');
            }

            const { data, error } = await supabase
                .from('prescricao')
                .select(`
                    *,
                    paciente:paciente_id (nome),
                    profissional:profissional_id (nome)
                `)
                .eq('ativo', true)
                .order('data_criacao', { ascending: false })
                .limit(100);

            if (error) throw new Error(`Erro ao listar prescrições: ${error.message}`);

            const prescricoes = data.map(d => ({
                id: d.id,
                paciente_nome: d.paciente?.nome || '',
                medico_nome: d.profissional?.nome || '',
                data_criacao: d.data_criacao,
                detalhesPrescricao: d.detalhes_prescricao,
                cid10: d.cid10,
            }));

            return { data: prescricoes, error: null };
        } catch (error) {
            return { data: [], error: error instanceof Error ? error : new Error('Erro desconhecido') };
        }
    }

    async getPrescricao(id: string, usuarioId: string): Promise<{ data: any | null, error: Error | null }> {
        try {
            const { data: usuario } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
                throw new Error('Apenas MEDICO, ENFERMEIRO e ADMINISTRADOR_PRINCIPAL podem visualizar prescrições');
            }

            const { data, error } = await supabase
                .from('prescricao')
                .select(`
                    *,
                    paciente:paciente_id (nome),
                    profissional:profissional_id (nome)
                `)
                .eq('id', id)
                .eq('ativo', true)
                .single();

            if (error || !data) {
                return { data: null, error: new Error('Prescrição não encontrada') };
            }

            const prescricao = {
                id: data.id,
                data_criacao: data.data_criacao,
                pacienteId: data.paciente_id,
                profissionalId: data.profissional_id,
                unidadeSaudeId: data.unidade_saude_id,
                detalhesPrescricao: data.detalhes_prescricao,
                cid10: data.cid10,
                paciente_nome: data.paciente?.nome || 'Paciente não encontrado',
                medico_nome: data.profissional?.nome || 'Médico não encontrado',
            };

            return { data: prescricao, error: null };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error('Erro desconhecido') };
        }
    }

    async listPrescricoesByPaciente(pacienteId: string, usuarioId: string): Promise<{ data: any[], error: Error | null }> {
        try {
            const { data: usuario } = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', usuarioId)
                .eq('ativo', true)
                .single();

            if (!usuario || (usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem visualizar prescrições');
            }

            const { data: paciente } = await supabase
                .from('paciente')
                .select('id')
                .eq('id', pacienteId)
                .eq('ativo', true)
                .single();

            if (!paciente) throw new Error('Paciente não encontrado');

            const { data, error } = await supabase
                .from('prescricao')
                .select(`
                    *,
                    profissional:profissional_id (nome)
                `)
                .eq('paciente_id', pacienteId)
                .eq('ativo', true)
                .order('data_criacao', { ascending: false })
                .limit(100);

            if (error) throw new Error(`Erro ao listar prescrições: ${error.message}`);

            const prescricoes = data.map(d => ({
                id: d.id,
                createdAt: d.data_criacao,
                profissionalId: d.profissional_id,
                detalhesPrescricao: d.detalhes_prescricao,
                cid10: d.cid10,
                medico_nome: d.profissional?.nome || 'Médico não encontrado',
            }));

            return { data: prescricoes, error: null };
        } catch (error) {
            return { data: [], error: error instanceof Error ? error : new Error('Erro desconhecido') };
        }
    }


    async updatePrescricao(
        id: string,
        detalhesPrescricao?: string,
        cid10?: string,
        profissionalId?: string
    ): Promise<{ data: Prescricao | null, error: Error | null }> {
        try {
            if (!profissionalId) throw new Error('ID do profissional é obrigatório');
            if (detalhesPrescricao && detalhesPrescricao.length < 10) {
                throw new Error('Detalhes da prescrição devem ter pelo menos 10 caracteres');
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
            if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
                throw new Error('Apenas MEDICO ou ENFERMEIRO podem atualizar prescrições');
            }

            const {data: prescricao} = await supabase
                .from('prescricao')
                .select('*')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!prescricao) throw new Error('Prescrição não encontrada');

            if (profissional.papel === Papeis.ENFERMEIRO) {
                const {data: unidade} = await supabase
                    .from('unidade_saude')
                    .select('tipo')
                    .eq('id', prescricao.unidade_saude_id)
                    .single();
                if (!unidade || unidade.tipo !== TipoUnidadeSaude.UPA) {
                    throw new Error('ENFERMEIRO só pode atualizar prescrições em UPAs');
                }
            }

            const updates: any = {};
            if (detalhesPrescricao) updates.detalhes_prescricao = detalhesPrescricao;
            if (cid10) updates.cid10 = cid10;

            const {data, error} = await supabase
                .from('prescricao')
                .update(updates)
                .eq('id', id)
                .eq('ativo', true)
                .select()
                .single();

            if (error || !data) return {data: null, error: new Error('Prescrição não encontrada')};

            if (detalhesPrescricao || cid10) {
                const prontuarioDescricao = `Prescrição atualizada em ${new Date().toLocaleDateString('pt-BR')}. Detalhes: ${detalhesPrescricao || prescricao.detalhes_prescricao}. CID-10: ${cid10 || prescricao.cid10}`;
                const {data: prontuario, error: prontuarioError} = await this.prontuarioService.createProntuario(
                    prescricao.paciente_id,
                    profissionalId,
                    prescricao.unidade_saude_id,
                    prontuarioDescricao,
                    prescricao.cid10
                );
                if (prontuarioError || !prontuario) {
                    throw new Error(`Erro ao criar entrada no prontuário: ${prontuarioError?.message || 'Erro desconhecido'}`);
                }
            }

            const prescricaoAtualizada = new Prescricao(
                data.id,
                data.paciente_id,
                data.profissional_id,
                data.unidade_saude_id,
                data.detalhes_prescricao,
                data.cid10,
                data.data_criacao
            );
            return {data: prescricaoAtualizada, error: null};
        } catch (error) {
            return {data: null, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }

    async deletePrescricao(id: string, profissionalId: string): Promise<{ data: boolean, error: Error | null }> {
        try {
            const {data: profissional} = await supabase
                .from('funcionario')
                .select('papel')
                .eq('id', profissionalId)
                .eq('ativo', true)
                .single();
            if (!profissional || profissional.papel !== Papeis.MEDICO) {
                throw new Error('Apenas MEDICO pode desativar prescrições');
            }

            const {data: prescricao} = await supabase
                .from('prescricao')
                .select('id')
                .eq('id', id)
                .eq('ativo', true)
                .single();
            if (!prescricao) throw new Error('Prescrição não encontrada');

            const {error} = await supabase
                .from('prescricao')
                .update({ativo: false, data_desativacao: new Date().toISOString()})
                .eq('id', id);

            if (error) throw new Error(`Erro ao desativar prescrição: ${error.message}`);
            return {data: true, error: null};
        } catch (error) {
            return {data: false, error: error instanceof Error ? error : new Error('Erro desconhecido')};
        }
    }
}