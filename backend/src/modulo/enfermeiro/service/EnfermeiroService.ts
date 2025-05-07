import {supabaseClient} from '../../../shared/database/supabase';
import {Enfermeiro} from '../model/Enfermeiro';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

const supabase = supabaseClient;

export class EnfermeiroService {
    async createEnfermeiro(
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
        coren: string,
        adminId: string
    ): Promise<Enfermeiro> {
        // Validações
        if (!nome || !cpf || !cns || !dataNascimento || !sexo || !racaCor || !escolaridade || !endereco || !telefone || !dataContratacao || !coren) {
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
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode criar enfermeiros');
        }

        // Verificar unicidade
        const {data: existing} = await supabase
            .from('funcionario')
            .select('id')
            .or(`cpf.eq.${cpf},cns.eq.${cns},registro_profissional.eq.${coren}`);
        if (existing && existing.length > 0) {
            throw new Error('CPF, CNS ou COREN já cadastrado');
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
                grupos_risco: [], // Default: empty array for enfermeiros
                consentimento_lgpd: true, // Default: true for enfermeiros
                papel: Papeis.ENFERMEIRO,
                data_contratacao: dataContratacao.toISOString(),
                registro_profissional: coren,
                criado_por: adminId
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar enfermeiro: ${error.message}`);
        return new Enfermeiro(
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

    async getEnfermeiro(id: string, usuarioId: string): Promise<Enfermeiro | null> {
        const {data: usuario} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', usuarioId)
            .single();
        if (!usuario || (usuario.papel !== Papeis.ADMINISTRADOR_PRINCIPAL && usuario.papel !== Papeis.ENFERMEIRO && usuarioId !== id)) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL, ENFERMEIRO ou o próprio enfermeiro podem visualizar');
        }

        const {data, error} = await supabase
            .from('funcionario')
            .select('*')
            .eq('id', id)
            .eq('papel', Papeis.ENFERMEIRO)
            .single();

        if (error || !data) return null;
        return new Enfermeiro(
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

    async updateEnfermeiro(
        id: string,
        nome?: string,
        coren?: string,
        dataContratacao?: Date,
        adminId?: string
    ): Promise<Enfermeiro | null> {
        if (!adminId) throw new Error('ID do administrador é obrigatório');
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode atualizar enfermeiros');
        }

        const updates: any = {};
        if (nome) updates.nome = nome;
        if (coren) updates.registro_profissional = coren;
        if (dataContratacao) updates.data_contratacao = dataContratacao.toISOString();

        // Verificar unicidade do COREN
        if (coren) {
            const {data: existing} = await supabase
                .from('funcionario')
                .select('id')
                .eq('registro_profissional', coren)
                .neq('id', id);
            if (existing && existing.length > 0) {
                throw new Error('COREN já cadastrado');
            }
        }

        const {data, error} = await supabase
            .from('funcionario')
            .update(updates)
            .eq('id', id)
            .eq('papel', Papeis.ENFERMEIRO)
            .select()
            .single();

        if (error || !data) return null;
        return new Enfermeiro(
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

    async deleteEnfermeiro(id: string, adminId: string): Promise<boolean> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode deletar enfermeiros');
        }

        const {error} = await supabase
            .from('funcionario')
            .delete()
            .eq('id', id)
            .eq('papel', Papeis.ENFERMEIRO);

        if (error) throw new Error(`Erro ao deletar enfermeiro: ${error.message}`);
        return true;
    }

    async listEnfermeiros(adminId: string): Promise<Enfermeiro[]> {
        const {data: admin} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', adminId)
            .single();
        if (!admin || admin.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
            throw new Error('Apenas ADMINISTRADOR_PRINCIPAL pode listar enfermeiros');
        }

        const {data, error} = await supabase
            .from('funcionario')
            .select('*')
            .eq('papel', Papeis.ENFERMEIRO)
            .limit(100);

        if (error) throw new Error(`Erro ao listar enfermeiros: ${error.message}`);
        return data.map((d: any) =>
            new Enfermeiro(
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