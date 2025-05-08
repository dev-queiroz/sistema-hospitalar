import {supabaseClient} from '../../../shared/database/supabase';
import {Triagem} from '../model/Triagem';
import {Paciente} from '../../paciente/model/Paciente';
import {NivelGravidade, Papeis} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';
import {PrioridadeService} from './PrioridadeService';

const supabase = supabaseClient;

export class TriagemService {
    async createTriagem(
        pacienteId: string,
        enfermeiroId: string,
        unidadeSaudeId: string,
        sinaisVitais: SinaisVitais,
        queixaPrincipal: string
    ): Promise<Triagem> {
        if (!pacienteId || !enfermeiroId || !unidadeSaudeId || !sinaisVitais || !queixaPrincipal) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        const {data: paciente} = await supabase
            .from('paciente')
            .select('*')
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
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode criar triagens');
        }

        const pacienteObj = new Paciente(paciente.id, paciente.nome, paciente.cpf, paciente.cns, new Date(paciente.data_nascimento), paciente.sexo, paciente.raca_cor, paciente.escolaridade, paciente.endereco, paciente.telefone, paciente.grupos_risco, paciente.consentimento_lgpd, paciente.email);
        const nivelGravidade = PrioridadeService.calcularNivelGravidade(pacienteObj, sinaisVitais, queixaPrincipal);

        const {data, error} = await supabase
            .from('triagem')
            .insert({
                paciente_id: pacienteId,
                enfermeiro_id: enfermeiroId,
                unidade_saude_id: unidadeSaudeId,
                nivel_gravidade: nivelGravidade,
                sinais_vitais: sinaisVitais,
                queixa_principal: queixaPrincipal,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar triagem: ${error.message}`);
        return new Triagem(data.id, data.paciente_id, data.enfermeiro_id, data.unidade_saude_id, data.nivel_gravidade, data.sinais_vitais, data.queixa_principal);
    }

    async getTriagem(id: string, usuarioId: string): Promise<Triagem | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO && usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL)) {
            throw new Error('Apenas ENFERMEIRO, MEDICO ou ADMINISTRADOR_PRINCIPAL podem visualizar triagens');
        }

        const {data, error} = await supabase
            .from('triagem')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Triagem(data.id, data.paciente_id, data.enfermeiro_id, data.unidade_saude_id, data.nivel_gravidade, data.sinais_vitais, data.queixa_principal);
    }

    async listTriagensByPaciente(pacienteId: string, usuarioId: string): Promise<Triagem[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem visualizar triagens');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', pacienteId)
            .single();
        if (!paciente) throw new Error('Paciente não encontrado');

        const {data, error} = await supabase
            .from('triagem')
            .select('*')
            .eq('paciente_id', pacienteId)
            .limit(100);

        if (error) throw new Error(`Erro ao listar triagens: ${error.message}`);
        return data.map((d: any) => new Triagem(d.id, d.paciente_id, d.enfermeiro_id, d.unidade_saude_id, d.nivel_gravidade, d.sinais_vitais, d.queixa_principal));
    }

    async listPacientesByGravidade(nivelGravidade: NivelGravidade, unidadeSaudeId: string, usuarioId: string): Promise<Paciente[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && usuario.papel !== Papeis.ENFERMEIRO)) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL ou ENFERMEIRO podem listar pacientes por gravidade');
        }

        const {data: unidade} = await supabase
            .from('unidade_saude')
            .select('id')
            .eq('id', unidadeSaudeId)
            .single();
        if (!unidade) throw new Error('Unidade de saúde não encontrada');

        const {data: triagens, error: triagemError} = await supabase
            .from('triagem')
            .select('paciente_id')
            .eq('unidade_saude_id', unidadeSaudeId)
            .eq('nivel_gravidade', nivelGravidade)
            .limit(100);

        if (triagemError) throw new Error(`Erro ao listar triagens: ${triagemError.message}`);
        const pacienteIds = triagens.map((t: any) => t.paciente_id);

        const {data, error} = await supabase
            .from('paciente')
            .select('*')
            .in('id', pacienteIds)
            .limit(100);

        if (error) throw new Error(`Erro ao listar pacientes: ${error.message}`);
        return data.map((d: any) => new Paciente(d.id, d.nome, d.cpf, d.cns, new Date(d.data_nascimento), d.sexo, d.raca_cor, d.escolaridade, d.endereco, d.telefone, d.grupos_risco, d.consentimento_lgpd, d.email));
    }

    async updateTriagem(
        id: string,
        sinaisVitais?: SinaisVitais,
        queixaPrincipal?: string,
        enfermeiroId?: string
    ): Promise<Triagem | null> {
        if (!enfermeiroId) throw new Error('ID do enfermeiro é obrigatório');
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode atualizar triagens');
        }

        const {data: triagem} = await supabase
            .from('triagem')
            .select('*')
            .eq('id', id)
            .single();
        if (!triagem) throw new Error('Triagem não encontrada');

        const updates: any = {};
        let nivelGravidade: NivelGravidade | undefined;
        if (sinaisVitais || queixaPrincipal) {
            const {data: paciente} = await supabase
                .from('paciente')
                .select('*')
                .eq('id', triagem.paciente_id)
                .single();
            if (!paciente) throw new Error('Paciente não encontrado');
            const pacienteObj = new Paciente(paciente.id, paciente.nome, paciente.cpf, paciente.cns, new Date(paciente.data_nascimento), paciente.sexo, paciente.raca_cor, paciente.escolaridade, paciente.endereco, paciente.telefone, paciente.grupos_risco, paciente.consentimento_lgpd, paciente.email);
            nivelGravidade = PrioridadeService.calcularNivelGravidade(pacienteObj, sinaisVitais || triagem.sinais_vitais, queixaPrincipal || triagem.queixa_principal);
            updates.nivel_gravidade = nivelGravidade;
        }
        if (sinaisVitais) updates.sinais_vitais = sinaisVitais;
        if (queixaPrincipal) updates.queixa_principal = queixaPrincipal;

        const {data, error} = await supabase
            .from('triagem')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new Triagem(data.id, data.paciente_id, data.enfermeiro_id, data.unidade_saude_id, data.nivel_gravidade, data.sinais_vitais, data.queixa_principal);
    }

    async deleteTriagem(id: string, enfermeiroId: string): Promise<boolean> {
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode deletar triagens');
        }

        const {data: triagem} = await supabase
            .from('triagem')
            .select('id')
            .eq('id', id)
            .single();
        if (!triagem) throw new Error('Triagem não encontrada');

        const {error} = await supabase
            .from('triagem')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar triagem: ${error.message}`);
        return true;
    }
}