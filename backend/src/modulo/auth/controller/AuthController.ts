import {Request, Response} from 'express';
import {supabaseClient, supabaseServiceClient} from '../../../shared/database/supabase'; // Importar ambos os clientes
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';

const LoginDTO = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const RegisterAdminDTO = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
    sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO'], {message: 'Sexo inválido'}),
    racaCor: z.enum(['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA'], {message: 'Raça/Cor inválida'}),
    escolaridade: z.enum(['FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'], {message: 'Escolaridade inválida'}),
    endereco: z.object({
        logradouro: z.string().min(1, 'Logradouro obrigatório'),
        numero: z.string().min(1, 'Número obrigatório'),
        bairro: z.string().min(1, 'Bairro obrigatório'),
        cidade: z.string().min(1, 'Cidade obrigatória'),
        estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
        cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    }),
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
    adminSecret: z.string().min(1, 'Senha especial obrigatória'),
});

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class AuthController {
    async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {email, password} = LoginDTO.parse(req.body);

            const {data: session, error} = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error || !session.session) {
                res.status(401).json({error: 'Credenciais inválidas ou usuário inativo'});
                return;
            }

            const { data: usuario, error: userError } = await supabaseClient
                .from('funcionario')
                .select('papel')
                .eq('id', session.user.id)
                .eq('ativo', true)
                .single();

            if (userError || !usuario) {
                res.status(401).json({error: 'Usuário não encontrado ou inativo'});
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
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
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
                adminSecret,
            } = validated;

            if (adminSecret !== process.env.ADMIN_SECRET) {
                res.status(403).json({error: 'Senha especial inválida'});
                return;
            }

            // Usar supabaseServiceClient para ignorar RLS na verificação de administradores
            const {data: existingAdmins, error: adminError} = await supabaseServiceClient
                .from('funcionario')
                .select('id')
                .eq('papel', Papeis.ADMINISTRADOR_PRINCIPAL)
                .eq('ativo', true);

            if (adminError) {
                console.error('Erro ao verificar administradores:', adminError);
                res.status(500).json({error: 'Erro ao verificar administradores existentes'});
                return;
            }

            if (existingAdmins.length > 0) {
                res.status(403).json({error: 'Já existe um administrador registrado'});
                return;
            }

            // Verificar duplicatas (email, CPF, CNS) usando supabaseClient (respeita RLS)
            const {data: existingUser, error: userError} = await supabaseClient
                .from('funcionario')
                .select('id')
                .or(`email.eq.${email},cpf.eq.${cpf},cns.eq.${cns}`);

            if (userError || existingUser.length > 0) {
                res.status(400).json({error: 'Email, CPF ou CNS já cadastrado'});
                return;
            }

            // Criar usuário no Supabase Authentication
            const {data: authUser, error: authError} = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {papel: Papeis.ADMINISTRADOR_PRINCIPAL, nome},
                },
            });

            if (authError || !authUser.user) {
                res.status(400).json({error: `Erro ao criar usuário: ${authError?.message}`});
                return;
            }

            // Inserir administrador na tabela funcionario
            const {data: funcionario, error: insertError} = await supabaseClient
                .from('funcionario')
                .insert({
                    id: authUser.user.id,
                    email,
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
                // Reverter criação do usuário no Supabase Authentication
                await supabaseServiceClient.auth.admin.deleteUser(authUser.user.id);
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

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const {email} = z.object({email: z.string().email('Email inválido')}).parse(req.body);

            const {data: usuario, error} = await supabaseClient
                .from('funcionario')
                .select('id')
                .eq('email', email)
                .eq('ativo', true)
                .single();

            if (error || !usuario) {
                res.status(200).json({message: 'Se o email existir, você receberá um link de recuperação'});
                return;
            }

            const {error: resetError} = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL}/redefinir-senha`,
            });

            if (resetError) {
                res.status(500).json({error: 'Erro ao enviar email de recuperação'});
                return;
            }

            res.status(200).json({message: 'Se o email existir, você receberá um link de recuperação'});
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }
}