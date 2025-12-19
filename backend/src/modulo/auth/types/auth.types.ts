import { Request } from 'express';
import { Papeis } from '../../core/model/Enums';

export interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    papel: string;
    expires_in: number;
}

export interface AdminRegistrationResponse {
    id: string;
    email: string;
    papel: string;
    message: string;
}

export interface ErrorResponse {
    error: string;
    errors?: Record<string, string[]>;
}

export interface SuccessResponse {
    message: string;
}

export interface Endereco {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}
