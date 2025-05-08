import { Request, Response } from 'express';
import { supabaseClient } from '../../../shared/database/supabase';
import { z } from 'zod';
import { Papeis } from '../../core/model/Enums';
import bcrypt from 'bcrypt';

const LoginDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6)
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
                .single();

            if (error || !usuario) {
                res.status(401).json({ error: 'Credenciais inválidas' });
                return;
            }

            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, usuario.password);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'Credenciais inválidas' });
                return;
            }

            // Criar sessão no Supabase para obter access e refresh tokens
            const { data: session, error: sessionError } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (sessionError || !session.session) {
                res.status(401).json({ error: 'Erro ao criar sessão' });
                return;
            }

            res.status(200).json({
                access_token: session.session.access_token,
                refresh_token: session.session.refresh_token,
                papel: usuario.papel,
                expires_in: session.session.expires_in
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

            // Renovar sessão com o refresh token
            const { data: session, error } = await supabaseClient.auth.refreshSession({
                refresh_token
            });

            if (error || !session.session) {
                res.status(401).json({ error: 'Refresh token inválido ou expirado' });
                return;
            }

            // Buscar papel do usuário para incluir na resposta
            const { data: usuario, error: userError } = await supabaseClient
                .from('funcionario')
                .select('papel')
                .eq('id', session.user?.id)
                .single();

            if (userError || !usuario) {
                res.status(400).json({ error: 'Usuário não encontrado' });
                return;
            }

            res.status(200).json({
                access_token: session.session.access_token,
                refresh_token: session.session.refresh_token,
                papel: usuario.papel,
                expires_in: session.session.expires_in
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}