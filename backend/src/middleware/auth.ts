import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {supabaseClient} from '../shared/database/supabase';
import {Papeis} from '../modulo/core/model/Enums';
import dotenv from 'dotenv';

dotenv.config();
const supabase = supabaseClient;

// Interface para req.user
interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

// Middleware para validar JWT
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'Token não fornecido'});
    }

    const token = authHeader.split(' ')[1];
    try {
        // Verificar JWT com JWT_SECRET do .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

        // Consultar o papel no Supabase
        const {data: usuario, error} = await supabase
            .from('funcionario')
            .select('papel')
            .eq('id', decoded.sub)
            .single();

        if (error || !usuario) {
            return res.status(401).json({error: 'Usuário não encontrado'});
        }

        // Armazenar usuarioId e papel em req.user
        req.user = {id: decoded.sub, papel: usuario.papel as Papeis};
        next();
    } catch (err) {
        return res.status(401).json({error: 'Token inválido'});
    }
};

// Middleware para restringir acesso por papel
export const restrictTo = (...roles: Papeis[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({error: 'Usuário não autenticado'});
        }

        if (!roles.includes(req.user.papel)) {
            return res.status(403).json({error: 'Acesso não autorizado'});
        }

        next();
    };
};