import {supabaseClient} from '../../../shared/database/supabase';
import {Prescricao} from '../model/Prescricao';
import {Papeis, TipoUnidadeSaude} from '../../core/model/Enums';

const supabase = supabaseClient;

export class PrescricaoService {
    async createPrescricao(pacienteId: string, profissionalId: string, detalhesPrescricao: string, cid10: string): Promise<Prescricao> {
        if (!pacienteId || !profissionalId || !detalhesPrescricao || !cid10) {
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
            throw new Error('Apenas MEDICO ou ENFERMEIRO podem criar prescrições');
        }
        if (profissional.papel === Papeis.ENFERMEIRO) {
            const {data: consultas} = await supabase
                .from('consulta')
                .select('unidade_saude_id')
                .eq('profissional_id', profissionalId)
                .eq('paciente_id', pacienteId);
            const unidadeIds = consultas?.map((c: any) => c.unidade_saude_id) || [];
            const {data: unidades} = await supabase
                .from('unidade_saude')
                .select('tipo')
                .in('id', unidadeIds);
            if (!unidades?.some((u: any) => u.tipo === TipoUnidadeSaude.UPA)) {
                throw new Error('ENFERMEIRO só pode criar prescrições em UPAs');
            }
        }

        const {data, error} = await supabase
            .from('prescricao')
            .insert({
                paciente_id: pacienteId,
                profissional_id: profissionalId,
                detalhes_prescricao: detalhesPrescricao,
                cid10,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar prescrição: ${error.message}`);
        return new Prescricao(data.id, data.paciente_id, data.profissional_id, data.detalhes_prescricao, data.cid10);
    }

    async getPrescricao(id: string, usuarioId: string): Promise<Prescricao | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem visualizar prescrições');
        }

        const {data, error} = await supabase
            .from('prescricao')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Prescricao(data.id, data.paciente_id, data.profissional_id, data.detalhes_prescricao, data.cid10);
    }

    async listPrescricoesByPaciente(pacienteId: string, usuarioId: string): Promise<Prescricao[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem visualizar prescrições');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', pacienteId)
            .single();
        if (!paciente) throw new Error('Paciente não encontrado');

        const {data, error} = await supabase
            .from('prescricao')
            .select('*')
            .eq('paciente_id', pacienteId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar prescrições: ${error.message}`);
        return data.map((d: any) => new Prescricao(d.id, d.paciente_id, d.profissional_id, d.detalhes_prescricao, d.cid10));
    }

    async updatePrescricao(
        id: string,
        detalhesPrescricao?: string,
        cid10?: string,
        profissionalId?: string
    ): Promise<Prescricao | null> {
        if (!profissionalId) throw new Error('ID do profissional é obrigatório');
        const {data: profissional} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', profissionalId)
            .single();
        if (!profissional || (profissional.papel !== Papeis.MEDICO && profissional.papel !== Papeis.ENFERMEIRO)) {
            throw new Error('Apenas MEDICO ou ENFERMEIRO podem atualizar prescrições');
        }

        const updates: any = {};
        if (detalhesPrescricao) updates.detalhes_prescricao = detalhesPrescricao;
        if (cid10) updates.cid10 = cid10;

        const {data, error} = await supabase
            .from('prescricao')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new Prescricao(data.id, data.paciente_id, data.profissional_id, data.detalhes_prescricao, data.cid10);
    }
}