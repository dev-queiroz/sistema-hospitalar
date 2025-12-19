import { z } from 'zod';
import { supabaseClient, supabaseServiceClient } from '../../../shared/database/supabase';
import { LoginDTO, RegisterAdminDTO, ForgotPasswordDTO } from '../dto/auth.dto';
import { Papeis } from '../../core/model/Enums';
import { AdminRegistrationResponse, Endereco } from '../types/auth.types';

export class AuthService {
    /**
     * Authenticate a user with email and password
     */
    async login(loginData: z.infer<typeof LoginDTO>): Promise<{ user: any; session: any }> {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password,
        });

        if (error || !data.session) {
            throw new Error('Credenciais inválidas ou usuário inativo');
        }

        return data;
    }

    /**
     * Register a new admin user
     */
    async registerAdmin(adminData: z.infer<typeof RegisterAdminDTO>): Promise<AdminRegistrationResponse> {
        // Verify admin secret
        if (adminData.adminSecret !== process.env.ADMIN_SECRET) {
            throw new Error('Senha especial inválida');
        }

        // Check for existing admin users
        await this.checkExistingAdmins();

        // Check for duplicate user data
        await this.checkDuplicateUserData(adminData);

        // Create auth user
        const authUser = await this.createAuthUser(adminData);

        // Create admin profile
        const funcionario = await this.createAdminProfile(adminData, authUser.user!.id);

        return {
            id: funcionario.id,
            email: funcionario.email,
            papel: funcionario.papel,
            message: 'Administrador registrado com sucesso',
        };
    }

    /**
     * Handle password reset request
     */
    async forgotPassword(email: string): Promise<void> {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/redefinir-senha`,
        });

        if (error) {
            throw new Error('Erro ao enviar email de recuperação');
        }
    }

    /**
     * Get user role from the database
     */
    async getUserRole(userId: string) {
        return await supabaseClient
            .from('funcionario')
            .select('papel')
            .eq('id', userId)
            .eq('ativo', true)
            .single();
    }

    /**
     * Check if a user exists and is active
     */
    async checkUserExists(email: string) {
        return await supabaseClient
            .from('funcionario')
            .select('id')
            .eq('email', email)
            .eq('ativo', true)
            .single();
    }

    private async checkExistingAdmins(): Promise<void> {
        const { data: existingAdmins, error } = await supabaseServiceClient
            .from('funcionario')
            .select('id')
            .eq('papel', Papeis.ADMINISTRADOR_PRINCIPAL)
            .eq('ativo', true);

        if (error) {
            console.error('Erro ao verificar administradores:', error);
            throw new Error('Erro ao verificar administradores existentes');
        }

        if (existingAdmins.length > 0) {
            throw new Error('Já existe um administrador registrado');
        }
    }

    private async checkDuplicateUserData(adminData: z.infer<typeof RegisterAdminDTO>): Promise<void> {
        const { data: existingUser, error } = await supabaseClient
            .from('funcionario')
            .select('id')
            .or(`email.eq.${adminData.email},cpf.eq.${adminData.cpf},cns.eq.${adminData.cns}`);

        if (error) {
            throw new Error('Erro ao verificar dados do usuário');
        }

        if (existingUser.length > 0) {
            throw new Error('Email, CPF ou CNS já cadastrado');
        }
    }

    private async createAuthUser(adminData: z.infer<typeof RegisterAdminDTO>) {
        const { data: authUser, error: authError } = await supabaseClient.auth.signUp({
            email: adminData.email,
            password: adminData.password,
            options: {
                data: { papel: Papeis.ADMINISTRADOR_PRINCIPAL, nome: adminData.nome },
            },
        });

        if (authError || !authUser.user) {
            throw new Error(`Erro ao criar usuário: ${authError?.message}`);
        }

        return authUser;
    }

    private async createAdminProfile(adminData: z.infer<typeof RegisterAdminDTO>, userId: string) {
        const { data: funcionario, error: insertError } = await supabaseClient
            .from('funcionario')
            .insert({
                id: userId,
                email: adminData.email,
                papel: Papeis.ADMINISTRADOR_PRINCIPAL,
                nome: adminData.nome,
                cpf: adminData.cpf,
                cns: adminData.cns,
                data_nascimento: adminData.dataNascimento,
                sexo: adminData.sexo,
                raca_cor: adminData.racaCor,
                escolaridade: adminData.escolaridade,
                endereco_logradouro: adminData.endereco.logradouro,
                endereco_numero: adminData.endereco.numero,
                endereco_bairro: adminData.endereco.bairro,
                endereco_cidade: adminData.endereco.cidade,
                endereco_estado: adminData.endereco.estado,
                endereco_cep: adminData.endereco.cep,
                telefone: adminData.telefone,
                data_contratacao: new Date().toISOString(),
                ativo: true,
            })
            .select()
            .single();

        if (insertError || !funcionario) {
            // Cleanup auth user if profile creation fails
            await supabaseServiceClient.auth.admin.deleteUser(userId);
            throw new Error(`Erro ao criar administrador: ${insertError?.message}`);
        }

        return funcionario;
    }
}
