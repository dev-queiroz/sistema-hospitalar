import {Request, Response} from 'express';
import {supabaseClient} from '../../../shared/database/supabase';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';
import bcrypt from 'bcrypt';

const LoginDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const RegisterAdminDTO = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    nome: z.string().min(3),
    cpf: z.string().regex(/^\d{11}$/),
    cns: z.string().regex(/^\d{15}$/),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
    racaCor: z.enum(['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA']),
    escolaridade: z.enum(['FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO']),
    endereco: z.object({
        logradouro: z.string(),
        numero: z.string(),
        bairro: z.string(),
        cidade: z.string(),
        estado: z.string().length(2),
        cep: z.string().regex(/^\d{8}$/),
    }),
    telefone: z.string().regex(/^\d{10,11}$/),
    adminSecret: z.string(),
});

const DeactivateUserDTO = z.object({
    motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
});

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class AuthController {
    async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = LoginDTO.parse(req.body);
            const { email, password } = validated;

            // Buscar usuário no Supabase
            const { data: usuario, error } = await supabaseClient
                .from('funcionario')
                .select('id, email, password, papel')
                .eq('email', email)
                .eq('ativo', true)
                .single();

            if (error || !usuario) {
                res.status(401).json({error: 'Credenciais inválidas ou usuário inativo'});
                return;
            }

            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, usuario.password);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'Credenciais inválidas' });
                return;
            }

            // Criar sessão no Supabase
            const { data: session, error: sessionError } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (sessionError || !session.session) {
                res.status(401).json({ error: 'Erro ao criar sessão' });
                return;
            }

            res.status(200).json({
                access_token: session.session.access_token,
                refresh_token: session.session.refresh_token,
                papel: usuario.papel,
                expires_in: session.session.expires_in,
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ errors: error.errors });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                res.status(400).json({ error: 'Refresh token não fornecido' });
                return;
            }

            // Renovar sessão
            const { data: session, error } = await supabaseClient.auth.refreshSession({
                refresh_token,
            });

            if (error || !session.session) {
                res.status(401).json({ error: 'Refresh token inválido ou expirado' });
                return;
            }

            // Buscar papel do usuário
            const { data: usuario, error: userError } = await supabaseClient
                .from('funcionario')
                .select('papel')
                .eq('id', session.user?.id)
                .eq('ativo', true)
                .single();

            if (userError || !usuario) {
                res.status(400).json({error: 'Usuário não encontrado ou inativo'});
                return;
            }

            res.status(200).json({
                access_token: session.session.access_token,
                refresh_token: session.session.refresh_token,
                papel: usuario.papel,
                expires_in: session.session.expires_in,
            });
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async registerAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = RegisterAdminDTO.parse(req.body);
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
                adminSecret
            } = validated;

            // Verificar senha especial
            if (adminSecret !== process.env.ADMIN_SECRET) {
                res.status(403).json({error: 'Senha especial inválida'});
                return;
            }

            // Verificar se já existe um administrador
            const {data: existingAdmins, error: adminError} = await supabaseClient
                .from('funcionario')
                .select('id')
                .eq('papel', Papeis.ADMINISTRADOR_PRINCIPAL)
                .eq('ativo', true);

            if (adminError) {
                res.status(500).json({error: 'Erro ao verificar administradores existentes'});
                return;
            }

            if (existingAdmins.length > 0) {
                res.status(403).json({error: 'Já existe um administrador registrado'});
                return;
            }

            // Verificar unicidade de email, cpf, cns
            const {data: existingUser, error: userError} = await supabaseClient
                .from('funcionario')
                .select('id')
                .or(`email.eq.${email},cpf.eq.${cpf},cns.eq.${cns}`);

            if (userError || existingUser.length > 0) {
                res.status(400).json({error: 'Email, CPF ou CNS já cadastrado'});
                return;
            }

            // Criar usuário no Supabase Auth
            const {data: authUser, error: authError} = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {papel: Papeis.ADMINISTRADOR_PRINCIPAL},
                },
            });

            if (authError || !authUser.user) {
                res.status(400).json({error: `Erro ao criar usuário: ${authError?.message}`});
                return;
            }

            // Hash da senha para armazenar na tabela funcionario
            const hashedPassword = await bcrypt.hash(password, 10);

            // Criar funcionário
            const {data: funcionario, error: insertError} = await supabaseClient
                .from('funcionario')
                .insert({
                    id: authUser.user.id,
                    email,
                    password: hashedPassword,
                    papel: Papeis.ADMINISTRADOR_PRINCIPAL,
                    nome,
                    cpf,
                    cns,
                    data_nascimento: dataNascimento,
                    sexo,
                    raca_cor: racaCor,
                    escolaridade,
                    endereco_logradouro: endereco.logradouro,
                    endereco_numero: endereco.numero,
                    endereco_bairro: endereco.bairro,
                    endereco_cidade: endereco.cidade,
                    endereco_estado: endereco.estado,
                    endereco_cep: endereco.cep,
                    telefone,
                    data_contratacao: new Date().toISOString(),
                    ativo: true,
                })
                .select()
                .single();

            if (insertError || !funcionario) {
                // Reverter criação no Supabase Auth
                await supabaseClient.auth.admin.deleteUser(authUser.user.id);
                res.status(500).json({error: `Erro ao criar administrador: ${insertError?.message}`});
                return;
            }

            res.status(201).json({
                id: funcionario.id,
                email: funcionario.email,
                papel: funcionario.papel,
                message: 'Administrador registrado com sucesso',
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async deactivate(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const validated = DeactivateUserDTO.parse(req.body);
            const {motivo} = validated;
            const adminId = req.user?.id;

            if (!adminId || req.user?.papel !== Papeis.ADMINISTRADOR_PRINCIPAL) {
                res.status(403).json({error: 'Apenas administradores podem desativar usuários'});
                return;
            }

            // Buscar funcionário a ser desativado
            const {data: funcionario, error: userError} = await supabaseClient
                .from('funcionario')
                .select('id, papel, ativo')
                .eq('id', id)
                .single();

            if (userError || !funcionario) {
                res.status(404).json({error: 'Funcionário não encontrado'});
                return;
            }

            if (!funcionario.ativo) {
                res.status(400).json({error: 'Funcionário já está inativo'});
                return;
            }

            // Verificar se é o último administrador ativo
            if (funcionario.papel === Papeis.ADMINISTRADOR_PRINCIPAL) {
                const {data: activeAdmins, error: adminError} = await supabaseClient
                    .from('funcionario')
                    .select('id')
                    .eq('papel', Papeis.ADMINISTRADOR_PRINCIPAL)
                    .eq('ativo', true);

                if (adminError || activeAdmins.length <= 1) {
                    res.status(403).json({error: 'Não é possível desativar o último administrador ativo'});
                    return;
                }
            }

            // Desativar no Supabase Auth
            const {error: authError} = await supabaseClient.auth.admin.deleteUser(id);
            if (authError) {
                res.status(500).json({error: `Erro ao desativar usuário no Supabase Auth: ${authError.message}`});
                return;
            }

            // Atualizar funcionário como inativo e registrar motivo
            const {error: updateError} = await supabaseClient
                .from('funcionario')
                .update({
                    ativo: false,
                    data_demissao: new Date().toISOString(),
                    motivo_demissao: motivo,
                })
                .eq('id', id);

            if (updateError) {
                res.status(500).json({error: `Erro ao desativar funcionário: ${updateError.message}`});
                return;
            }

            res.status(200).json({message: 'Funcionário desativado com sucesso'});
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }
}