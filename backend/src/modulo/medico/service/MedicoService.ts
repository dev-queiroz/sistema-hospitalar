import {supabaseClient} from '../../../shared/database/supabase';
import {Medico} from '../model/Medico';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

const supabase = supabaseClient;

export class MedicoService {
    async createMedico(
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        email: string | undefined,
        dataContratacao: Date,
        crm: string,
        adminId: string
    ): Promise<Medico> {
        // Validações
        if (!nome || !cpf || !cns || !dataNascimento || !sexo || !racaCor || !escolaridade || !endereco || !telefone || !dataContratacao || !crm) {
            throw new Error('Campos obrigatórios não preenchidos');
        }
        if (!/^\d{11}$/.test(cpf)) {
            throw new Error('CPF inválido (deve ter 11 dígitos)');
        }
        if (!/^\d{15}$/.test(cns)) {
            throw new Error('CNS inválido (deve ter 15 dígitos)');
        }
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar médicos');
        }

        // Verificar unicidade
        const {data: existing} = await supabase
            .from('funcionario')
            .select('id')
            .or(`cpf.eq.${cpf},cns.eq.${cns},registro_profissional.eq.${crm}`);
        if (existing && existing.length > 0) {
            throw new Error('CPF, CNS ou CRM já cadastrado');
        }

        const {data, error} = await supabase
            .from('funcionario')
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
                grupos_risco: [], // Default: empty array for médicos
                consentimento_lgpd: true, // Default: true for médicos
                papel: Papeis.MEDICO,
                data_contratacao: dataContratacao.toISOString(),
                registro_profissional: crm,
                criado_por: adminId
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar médico: ${error.message}`);
        return new Medico(
            data.id,
            data.nome,
            data.cpf,
            data.cns,
            new Date(data.data_nascimento),
            data.sexo,
            data.raca_cor,
            data.escolaridade,
            data.endereco,
            data.telefone,
            data.grupos_risco,
            data.consentimento_lgpd,
            new Date(data.data_contratacao),
            data.registro_profissional,
            data.email
        );
    }

    async getMedico(id: string, usuarioId: string): Promise<Medico | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && usuario.papel !== Papeis.MEDICO && usuarioId !== id)) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL, MEDICO ou o próprio médico podem visualizar');
        }

        const {data, error} = await supabase
            .from('funcionario')
            .select('*')
            .eq('id', id)
            .eq('papel', Papeis.MEDICO)
            .single();

        if (error || !data) return null;
        return new Medico(
            data.id,
            data.nome,
            data.cpf,
            data.cns,
            new Date(data.data_nascimento),
            data.sexo,
            data.raca_cor,
            data.escolaridade,
            data.endereco,
            data.telefone,
            data.grupos_risco,
            data.consentimento_lgpd,
            new Date(data.data_contratacao),
            data.registro_profissional,
            data.email
        );
    }

    async updateMedico(
        id: string,
        nome?: string,
        crm?: string,
        dataContratacao?: Date,
        adminId?: string
    ): Promise<Medico | null> {
        if (!adminId) throw new Error('ID do administrador é obrigatório');
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar médicos');
        }

        const updates: any = {};
        if (nome) updates.nome = nome;
        if (crm) updates.registro_profissional = crm;
        if (dataContratacao) updates.data_contratacao = dataContratacao.toISOString();

        // Verificar unicidade do CRM
        if (crm) {
            const {data: existing} = await supabase
                .from('funcionario')
                .select('id')
                .eq('registro_profissional', crm)
                .neq('id', id);
            if (existing && existing.length > 0) {
                throw new Error('CRM já cadastrado');
            }
        }

        const {data, error} = await supabase
            .from('funcionario')
            .update(updates)
            .eq('id', id)
            .eq('papel', Papeis.MEDICO)
            .select()
            .single();

        if (error || !data) return null;
        return new Medico(
            data.id,
            data.nome,
            data.cpf,
            data.cns,
            new Date(data.data_nascimento),
            data.sexo,
            data.raca_cor,
            data.escolaridade,
            data.endereco,
            data.telefone,
            data.grupos_risco,
            data.consentimento_lgpd,
            new Date(data.data_contratacao),
            data.registro_profissional,
            data.email
        );
    }

    async deleteMedico(id: string, adminId: string): Promise<boolean> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar médicos');
        }

        const {error} = await supabase
            .from('funcionario')
            .delete()
            .eq('id', id)
            .eq('papel', Papeis.MEDICO);

        if (error) throw new Error(`Erro ao deletar médico: ${error.message}`);
        return true;
    }

    async listMedicos(usuarioId: string): Promise<Medico[]> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && usuario.papel !== Papeis.MEDICO)) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL ou MEDICO podem listar médicos');
        }

        const {data, error} = await supabase
            .from('funcionario')
            .select('*')
            .eq('papel', Papeis.MEDICO)
            .limit(100);

        if (error) throw new Error(`Erro ao listar médicos: ${error.message}`);
        return data.map((d: any) =>
            new Medico(
                d.id,
                d.nome,
                d.cpf,
                d.cns,
                new Date(d.data_nascimento),
                d.sexo,
                d.raca_cor,
                d.escolaridade,
                d.endereco,
                d.telefone,
                d.grupos_risco,
                d.consentimento_lgpd,
                new Date(d.data_contratacao),
                d.registro_profissional,
                d.email
            )
        );
    }
}