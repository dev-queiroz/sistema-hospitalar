import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {supabaseClient} from '@/shared/database/supabase';
import {Papeis} from '@/modulo/core/model/Enums';
import dotenv from 'dotenv';

dotenv.config();
const supabase = supabaseClient;

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({error: 'Token não fornecido'});
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

        const {data: usuario, error} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', decoded.sub)
            .single();

        if (error || !usuario) {
            res.status(401).json({error: 'Usuário não encontrado'});
            return;
        }

        req.user = {id: decoded.sub, papel: usuario.papel as Papeis};
        next();
    } catch (err) {
        res.status(401).json({error: 'Token inválido'});
    }
};

export const restrictTo = (...roles: Papeis[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({error: 'Usuário não autenticado'});
            return;
        }

        if (!roles.includes(req.user.papel)) {
            res.status(403).json({error: 'Acesso não autorizado'});
            return;
        }

        next();
    };
};