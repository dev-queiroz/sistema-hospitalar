import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

interface SupabaseUser {
    id: string;
    role?: string;
    [key: string]: any;
}

declare module 'express' {
    interface Request {
        user?: SupabaseUser;
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new Error('Token de autenticação não fornecido'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return next(new Error('Token inválido ou expirado'));
        }

        req.user = {
            id: data.user.id,
            role: data.user.role || 'patient',
        };

        next();
    } catch (err) {
        next(err);
    }
};