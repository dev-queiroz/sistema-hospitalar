// src/controller/AuthController.ts
import { Request, Response } from 'express';
import { supabaseClient } from '@/shared/database/supabase';
import { LoginDTO, RegisterAdminDTO } from '../dto/auth.dto';
import { AuthService } from '../services/AuthService';
import { z } from 'zod';

const authService = new AuthService();

export class AuthController {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = LoginDTO.parse(req.body);
            const result = await authService.login(email, password);

            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Dados inválidos', details: error.message });
            }
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async registerAdmin(req: Request, res: Response) {
        try {
            const data = RegisterAdminDTO.parse(req.body);
            const result = await authService.registerAdmin(data);

            return res.status(201).json(result);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Dados inválidos', details: error.message });
            }
            return res.status(400).json({ error: (error as Error).message });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = z.object({ email: z.string().email() }).parse(req.body);
            await authService.forgotPassword(email);

            return res.status(200).json({ message: 'Se o email existir, você receberá um link de recuperação' });
        } catch (error) {
            return res.status(400).json({ error: 'Email inválido' });
        }
    }

    async me(req: Request, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            const token = authHeader.split(' ')[1];

            const profile = await authService.getCurrentUserProfile(token);
            if (!profile) {
                return res.status(401).json({ error: 'Usuário não autenticado ou perfil não encontrado' });
            }

            return res.status(200).json(profile);
        } catch (error) {
            console.error('Erro em /me:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

export const authController = new AuthController();