// src/services/AuthService.ts
import { z } from 'zod';
import { supabaseClient, supabaseServiceClient } from '@/shared/database/supabase';
import { RegisterAdminDTO, LoginDTO } from '../dto/auth.dto';
import { Papeis } from '../../core/model/Enums';

export class AuthService {
    async login(email: string, password: string) {
        const loginData = LoginDTO.parse({ email, password });
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password,
        });

        if (error || !data.session || !data.user) {
            throw new Error('Credenciais inválidas');
        }

        const { data: funcionario, error: funcError } = await supabaseClient
            .from('funcionario')
            .select('papel')
            .eq('id', data.user.id)
            .eq('ativo', true)
            .single();

        if (funcError || !funcionario) {
            throw new Error('Perfil do usuário não encontrado ou inativo');
        }

        return {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token || undefined,
            papel: funcionario.papel,
            expires_in: data.session.expires_at,
            user_id: data.user.id,
        };
    }

    async registerAdmin(adminData: z.infer<typeof RegisterAdminDTO>) {
        const {
            nome,
            email,
            password,
            cpf,
            cns,
            dataNascimento,
            sexo,
            racaCor,
            escolaridade,
            endereco,
            telefone,
            adminSecret,
        } = adminData;

        // 1. Verifica senha especial
        if (adminSecret !== process.env.ADMIN_SECRET) {
            throw new Error('Senha especial inválida');
        }

        // 2. Verifica se já existe admin (ignora RLS)
        const { data: existingAdmins } = await supabaseServiceClient
            .from('funcionario')
            .select('id')
            .eq('papel', Papeis.ADMINISTRADOR_PRINCIPAL)
            .eq('ativo', true);

        if (existingAdmins && existingAdmins.length > 0) {
            throw new Error('Já existe um administrador registrado');
        }

        // 3. Verifica duplicatas (email, CPF, CNS)
        const { data: existingUser } = await supabaseClient
            .from('funcionario')
            .select('id')
            .or(`email.eq.${email},cpf.eq.${cpf},cns.eq.${cns}`)
            .limit(1);

        if (existingUser && existingUser.length > 0) {
            throw new Error('Email, CPF ou CNS já cadastrado');
        }

        // 4. Cria usuário no Supabase Auth
        const { data: authUser, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { nome, papel: Papeis.ADMINISTRADOR_PRINCIPAL },
            },
        });

        if (authError || !authUser.user) {
            throw new Error(`Erro ao criar usuário: ${authError?.message || 'Desconhecido'}`);
        }

        // 5. Cria perfil do administrador
        const { data: funcionario, error: insertError } = await supabaseClient
            .from('funcionario')
            .insert({
                id: authUser.user.id,
                email,
                nome,
                cpf,
                cns,
                data_nascimento: dataNascimento,
                sexo,
                raca_cor: racaCor,
                escolaridade,
                telefone,
                endereco_logradouro: endereco.logradouro,
                endereco_numero: endereco.numero,
                endereco_bairro: endereco.bairro,
                endereco_cidade: endereco.cidade,
                endereco_estado: endereco.estado,
                endereco_cep: endereco.cep,
                papel: Papeis.ADMINISTRADOR_PRINCIPAL,
                data_contratacao: new Date().toISOString(),
                ativo: true,
            })
            .select()
            .single();

        if (insertError || !funcionario) {
            // Reverte usuário no auth
            await supabaseServiceClient.auth.admin.deleteUser(authUser.user.id);
            throw new Error(`Erro ao criar perfil: ${insertError?.message}`);
        }

        return {
            id: funcionario.id,
            email: funcionario.email,
            papel: funcionario.papel,
            message: 'Administrador registrado com sucesso',
        };
    }

    async forgotPassword(email: string) {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/redefinir-senha`,
        });

        if (error) {
            throw new Error('Erro ao enviar email de recuperação');
        }
    }

    async getCurrentUserProfile(token: string) {
        // Valida o token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            return null;
        }

        // Busca dados do funcionário
        const { data: funcionario, error: funcError } = await supabaseClient
            .from('funcionario')
            .select('id, nome, email, papel, ativo')
            .eq('id', user.id)
            .eq('ativo', true)
            .single();

        if (funcError || !funcionario) {
            return null;
        }

        // Busca unidade (assumindo relação via funcionario_unidade ou diretamente em funcionario)
        let unidadeSaudeId = null;
        let unidadeSaudeNome = null;

        // Opção 1: se tiver coluna direta unidade_saude_id em funcionario
        if ((funcionario as any).unidade_saude_id) {
            unidadeSaudeId = (funcionario as any).unidade_saude_id;
        } else {
            // Opção 2: via tabela de relação funcionario_unidade
            const { data: relacao } = await supabaseClient
                .from('funcionario_unidade')
                .select('unidade_saude_id')
                .eq('funcionario_id', user.id)
                .single();

            unidadeSaudeId = relacao?.unidade_saude_id || null;
        }

        // Busca nome da unidade
        if (unidadeSaudeId) {
            const { data: unidade } = await supabaseClient
                .from('unidade_saude')
                .select('nome')
                .eq('id', unidadeSaudeId)
                .single();

            unidadeSaudeNome = unidade?.nome || null;
        }

        return {
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            papel: funcionario.papel,
            unidadeSaudeId,
            unidadeSaudeNome,
        };
    }
}