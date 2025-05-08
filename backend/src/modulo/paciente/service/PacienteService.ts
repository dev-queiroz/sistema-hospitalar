import {supabaseClient} from '../../../shared/database/supabase';
import {Paciente} from '../model/Paciente';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';
import {Prontuario} from '../../prontuario/model/Prontuario';
import {Prescricao} from '../../prescricao/model/Prescricao';
import {Consulta} from '../../consulta/model/Consulta';

const supabase = supabaseClient;

export class PacienteService {
    async createPaciente(
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        gruposRisco: string[],
        consentimentoLGPD: boolean,
        enfermeiroId: string,
        email?: string
    ): Promise<Paciente> {
        if (!nome || !cpf || !cns || !dataNascimento || !sexo || !racaCor || !escolaridade || !endereco || !telefone || !gruposRisco || consentimentoLGPD === undefined) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        if (!/^\d{11}$/.test(cpf)) {
            throw new Error('CPF inválido (deve ter 11 dígitos)');
        }
        if (!/^\d{15}$/.test(cns)) {
            throw new Error('CNS inválido (deve ter 15 dígitos)');
        }
        if (!consentimentoLGPD) {
            throw new Error('Consentimento LGPD é obrigatório');
        }
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode criar pacientes');
        }

        const {data: existing} = await supabase
            .from('paciente')
            .select('id')
            .or(`cpf.eq.${cpf},cns.eq.${cns}`);
        if (existing && existing.length > 0) {
            throw new Error('CPF ou CNS já cadastrado');
        }

        const {data, error} = await supabase
            .from('paciente')
            .insert({
                nome,
                cpf,
                cns,
                data_nascimento: dataNascimento.toISOString(),
                sexo,
                raca_cor: racaCor,
                escolaridade,
                endereco,
                telefone,
                email,
                grupos_risco: gruposRisco,
                consentimento_lgpd: consentimentoLGPD,
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar paciente: ${error.message}`);
        return new Paciente(data.id, data.nome, data.cpf, data.cns, new Date(data.data_nascimento), data.sexo, data.raca_cor, data.escolaridade, data.endereco, data.telefone, data.grupos_risco, data.consentimento_lgpd, data.email);
    }

    async getPaciente(id: string, usuarioId: string): Promise<Paciente | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem visualizar pacientes');
        }

        const {data, error} = await supabase
            .from('paciente')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return new Paciente(data.id, data.nome, data.cpf, data.cns, new Date(data.data_nascimento), data.sexo, data.raca_cor, data.escolaridade, data.endereco, data.telefone, data.grupos_risco, data.consentimento_lgpd, data.email);
    }

    async updatePaciente(
        id: string,
        nome?: string,
        cpf?: string,
        cns?: string,
        dataNascimento?: Date,
        sexo?: Sexo,
        racaCor?: RacaCor,
        escolaridade?: Escolaridade,
        endereco?: Endereco,
        telefone?: string,
        gruposRisco?: string[],
        consentimentoLGPD?: boolean,
        enfermeiroId?: string,
        email?: string
    ): Promise<Paciente | null> {
        if (!enfermeiroId) throw new Error('ID do enfermeiro é obrigatório');
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode atualizar pacientes');
        }

        if (cpf && !/^\d{11}$/.test(cpf)) {
            throw new Error('CPF inválido (deve ter 11 dígitos)');
        }
        if (cns && !/^\d{15}$/.test(cns)) {
            throw new Error('CNS inválido (deve ter 15 dígitos)');
        }
        if (consentimentoLGPD === false) {
            throw new Error('Consentimento LGPD não pode ser revogado');
        }

        const updates: any = {};
        if (nome) updates.nome = nome;
        if (cpf) updates.cpf = cpf;
        if (cns) updates.cns = cns;
        if (dataNascimento) updates.data_nascimento = dataNascimento.toISOString();
        if (sexo) updates.sexo = sexo;
        if (racaCor) updates.raca_cor = racaCor;
        if (escolaridade) updates.escolaridade = escolaridade;
        if (endereco) updates.endereco = endereco;
        if (telefone) updates.telefone = telefone;
        if (gruposRisco) updates.grupos_risco = gruposRisco;
        if (consentimentoLGPD !== undefined) updates.consentimento_lgpd = consentimentoLGPD;
        if (email !== undefined) updates.email = email;

        if (cpf || cns) {
            const {data: existing} = await supabase
                .from('paciente')
                .select('id')
                .or(`cpf.eq.${cpf || ''},cns.eq.${cns || ''}`)
                .neq('id', id);
            if (existing && existing.length > 0) {
                throw new Error('CPF ou CNS já cadastrado');
            }
        }

        const {data, error} = await supabase
            .from('paciente')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return null;
        return new Paciente(data.id, data.nome, data.cpf, data.cns, new Date(data.data_nascimento), data.sexo, data.raca_cor, data.escolaridade, data.endereco, data.telefone, data.grupos_risco, data.consentimento_lgpd, data.email);
    }

    async deletePaciente(id: string, enfermeiroId: string): Promise<boolean> {
        const {data: enfermeiro} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', enfermeiroId)
            .single();
        if (!enfermeiro || enfermeiro.papel !== Papeis.ENFERMEIRO) {
            throw new Error('Apenas ENFERMEIRO pode deletar pacientes');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', id)
            .single();
        if (!paciente) throw new Error('Paciente não encontrado');

        const {error} = await supabase
            .from('paciente')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar paciente: ${error.message}`);
        return true;
    }

    async listPacientes(usuarioId: string): Promise<Paciente[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem listar pacientes');
        }

        const {data, error} = await supabase
            .from('paciente')
            .select('*')
            .limit(100);

        if (error) throw new Error(`Erro ao listar pacientes: ${error.message}`);
        return data.map((d: any) => new Paciente(d.id, d.nome, d.cpf, d.cns, new Date(d.data_nascimento), d.sexo, d.raca_cor, d.escolaridade, d.endereco, d.telefone, d.grupos_risco, d.consentimento_lgpd, d.email));
    }

    async getPacienteHistorico(id: string, usuarioId: string): Promise<{
        prontuarios: Prontuario[],
        prescricoes: Prescricao[],
        consultas: Consulta[]
    } | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem visualizar histórico');
        }

        const {data: paciente} = await supabase
            .from('paciente')
            .select('id')
            .eq('id', id)
            .single();
        if (!paciente) return null;

        const [prontuarios, prescricoes, consultas] = await Promise.all([
            supabase
                .from('prontuario')
                .select('*')
                .eq('paciente_id', id)
                .limit(100)
                .then(({data, error}) => {
                    if (error) throw new Error(`Erro ao buscar prontuários: ${error.message}`);
                    return data.map((d: any) => new Prontuario(d.id, d.paciente_id, d.profissional_id, d.descricao, d.dados_anonimizados));
                }),
            supabase
                .from('prescricao')
                .select('*')
                .eq('paciente_id', id)
                .limit(100)
                .then(({data, error}) => {
                    if (error) throw new Error(`Erro ao buscar prescrições: ${error.message}`);
                    return data.map((d: any) => new Prescricao(d.id, d.paciente_id, d.profissional_id, d.detalhes_prescricao, d.cid10));
                }),
            supabase
                .from('consulta')
                .select('*')
                .eq('paciente_id', id)
                .limit(100)
                .then(({data, error}) => {
                    if (error) throw new Error(`Erro ao buscar consultas: ${error.message}`);
                    return data.map((d: any) => new Consulta(d.id, d.paciente_id, d.profissional_id, d.unidade_saude_id, d.observacoes, d.cid10));
                }),
        ]);

        return {prontuarios, prescricoes, consultas};
    }

    async searchPacientesByCpfOrCns(cpfOrCns: string, usuarioId: string): Promise<Paciente[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ENFERMEIRO && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ENFERMEIRO ou MEDICO podem buscar pacientes');
        }

        const {data, error} = await supabase
            .from('paciente')
            .select('*')
            .or(`cpf.eq.${cpfOrCns},cns.eq.${cpfOrCns}`)
            .limit(10);

        if (error) throw new Error(`Erro ao buscar pacientes: ${error.message}`);
        return data.map((d: any) => new Paciente(d.id, d.nome, d.cpf, d.cns, new Date(d.data_nascimento), d.sexo, d.raca_cor, d.escolaridade, d.endereco, d.telefone, d.grupos_risco, d.consentimento_lgpd, d.email));
    }
}