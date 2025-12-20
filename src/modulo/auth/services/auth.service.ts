import { supabaseClient, supabaseServiceClient } from '../../../shared/database/supabase';
import { LoginDTO, RegisterAdminDTO } from '../dto/auth.dto';
import { LoginResponse, AdminRegistrationResponse } from '../types/auth.types';
import { TokenService } from './token.service';
import { AUTH_ERRORS, AUTH_MESSAGES, RATE_LIMIT } from '../constants/auth.constants';
import { z } from 'zod';

export class AuthService {
    private tokenService: TokenService;

    constructor() {
        this.tokenService = TokenService.getInstance();
    }

    public async login(credentials: z.infer<typeof LoginDTO>): Promise<LoginResponse> {
        try {
            await this.checkLoginAttempts(credentials.email);

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error || !data.session) {
                throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
            }

            const { data: userData, error: userError } = await this.getUserRole(data.user.id);

            if (userError || !userData) {
                throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
            }

            const { accessToken, refreshToken, expiresIn } =
                await this.tokenService.generateTokens(data.user.id, userData.papel);

            await this.resetLoginAttempts(credentials.email);

            return {
                access_token: accessToken,
                refresh_token: refreshToken,
                papel: userData.papel,
                expires_in: expiresIn,
                user_id: data.user.id
            };
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_ERRORS.INVALID_CREDENTIALS) {
                await this.recordFailedLoginAttempt(credentials.email);
            }
            throw error;
        }
    }

    public async registerAdmin(adminData: z.infer<typeof RegisterAdminDTO>): Promise<AdminRegistrationResponse> {
        if (adminData.adminSecret !== process.env.ADMIN_SECRET) {
            throw new Error(AUTH_ERRORS.INVALID_ADMIN_SECRET);
        }

        await this.checkExistingAdmins();
        await this.checkDuplicateUserData(adminData);

        const authUser = await this.createAuthUser(adminData);
        const funcionario = await this.createAdminProfile(adminData, authUser.user!.id);

        return {
            id: funcionario.id,
            email: funcionario.email,
            papel: funcionario.papel,
            message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
        };
    }

    public async forgotPassword(email: string): Promise<{ message: string }> {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL}/redefinir-senha`,
            });

            if (error) {
                new Error(AUTH_ERRORS.PASSWORD_RESET_FAILED);
            }

            return { message: AUTH_MESSAGES.PASSWORD_RESET_SENT };
        } catch (error) {
            console.error('Password reset error:', error);
            throw new Error(AUTH_ERRORS.PASSWORD_RESET_FAILED);
        }
    }

    public async getUserRole(userId: string) {
        return supabaseClient
            .from('funcionario')
            .select('papel')
            .eq('id', userId)
            .eq('ativo', true)
            .single();
    }

    private async checkLoginAttempts(email: string): Promise<void> {
        const { data: lockData } = await supabaseServiceClient
            .from('login_attempts')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (lockData?.is_locked) {
            const lockTime = new Date(lockData.locked_until).getTime();
            const currentTime = Date.now();
            
            if (lockTime > currentTime) {
                const remainingMinutes = Math.ceil((lockTime - currentTime) / (60 * 1000));
                throw new Error(AUTH_ERRORS.ACCOUNT_LOCKED.replace('15', remainingMinutes.toString()));
            }
        }

        const oneHourAgo = new Date(Date.now() - RATE_LIMIT.ATTEMPTS_WINDOW).toISOString();
        
        const { count } = await supabaseServiceClient
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)
            .gte('created_at', oneHourAgo)
            .eq('was_successful', false);

        if (count && count >= RATE_LIMIT.MAX_LOGIN_ATTEMPTS) {
            await supabaseServiceClient
                .from('login_attempts')
                .insert({
                    email,
                    was_successful: false,
                    is_locked: true,
                    locked_until: new Date(Date.now() + RATE_LIMIT.LOCKOUT_DURATION).toISOString()
                });
            
            throw new Error(AUTH_ERRORS.TOO_MANY_ATTEMPTS);
        }
    }

    private async recordFailedLoginAttempt(email: string): Promise<void> {
        const oneHourAgo = new Date(Date.now() - RATE_LIMIT.ATTEMPTS_WINDOW).toISOString();
        
        const { count } = await supabaseServiceClient
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)
            .gte('created_at', oneHourAgo)
            .eq('was_successful', false);

        const shouldLock = count && count >= RATE_LIMIT.MAX_LOGIN_ATTEMPTS - 1;

        await supabaseServiceClient
            .from('login_attempts')
            .insert({
                email,
                was_successful: false,
                is_locked: shouldLock,
                ...(shouldLock ? {
                    locked_until: new Date(Date.now() + RATE_LIMIT.LOCKOUT_DURATION).toISOString()
                } : {})
            });

        if (shouldLock) {
            throw new Error(AUTH_ERRORS.ACCOUNT_LOCKED);
        }
    }

    private async resetLoginAttempts(email: string): Promise<void> {
        await supabaseServiceClient
            .from('login_attempts')
            .insert({
                email,
                was_successful: true,
                is_locked: false
            });
    }

    private async checkExistingAdmins(): Promise<void> {
        const { data: existingAdmins, error } = await supabaseServiceClient
            .from('funcionario')
            .select('id')
            .eq('papel', 'ADMINISTRADOR_PRINCIPAL')
            .eq('ativo', true);

        if (error) {
            console.error('Erro ao verificar administradores:', error);
            throw new Error('Erro ao verificar administradores existentes');
        }

        if (existingAdmins.length > 0) {
            throw new Error(AUTH_ERRORS.ADMIN_EXISTS);
        }
    }

    private async checkDuplicateUserData(adminData: any): Promise<void> {
        const { data: existingUser, error } = await supabaseClient
            .from('funcionario')
            .select('id, email, cpf, cns')
            .or(`email.eq.${adminData.email},cpf.eq.${adminData.cpf},cns.eq.${adminData.cns}`);

        if (error) {
            throw new Error('Erro ao verificar dados do usuário');
        }

        if (existingUser && existingUser.length > 0) {
            const user = existingUser[0];
            if (user.email === adminData.email) {
                throw new Error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
            } else if (user.cpf === adminData.cpf) {
                throw new Error(AUTH_ERRORS.CPF_ALREADY_EXISTS);
            } else if (user.cns === adminData.cns) {
                throw new Error(AUTH_ERRORS.CNS_ALREADY_EXISTS);
            }
        }
    }

    private async createAuthUser(adminData: any) {
        const { data: authUser, error: authError } = await supabaseClient.auth.signUp({
            email: adminData.email,
            password: adminData.password,
            options: {
                data: {
                    nome: adminData.nome,
                    papel: 'ADMINISTRADOR_PRINCIPAL'
                },
                emailRedirectTo: `${process.env.FRONTEND_URL}/login`
            },
        });

        if (authError || !authUser.user) {
            throw new Error(`${AUTH_ERRORS.USER_CREATION_FAILED}: ${authError?.message}`);
        }

        return authUser;
    }

    private async createAdminProfile(adminData: any, userId: string) {
        const { data: funcionario, error: insertError } = await supabaseClient
            .from('funcionario')
            .insert({
                id: userId,
                email: adminData.email,
                papel: 'ADMINISTRADOR_PRINCIPAL',
                nome: adminData.nome,
                cpf: adminData.cpf,
                cns: adminData.cns,
                data_nascimento: adminData.dataNascimento,
                sexo: adminData.sexo,
                raca_cor: adminData.racaCor,
                escolaridade: adminData.escolaridade,
                endereco_logradouro: adminData.endereco.logradouro,
                endereco_numero: adminData.endereco.numero,
                endereco_complemento: adminData.endereco.complemento || null,
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
            await supabaseServiceClient.auth.admin.deleteUser(userId);
            throw new Error(`${AUTH_ERRORS.ADMIN_CREATION_FAILED}: ${insertError?.message}`);
        }

        return funcionario;
    }

    public async resetPassword(email: string): Promise<void> {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/redefinir-senha`,
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            throw new Error(AUTH_ERRORS.PASSWORD_RESET_FAILED);
        }
    }
}