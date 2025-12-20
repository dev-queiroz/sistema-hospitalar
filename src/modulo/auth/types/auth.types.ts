import { Request } from 'express';
import { Papeis } from '../../core/model/Enums';

export interface AuthenticatedRequest extends Request {
    user?: { 
        id: string; 
        papel: Papeis;
        email?: string;
    };
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    papel: Papeis;
    expires_in: number;
    user_id: string;
}

export interface AdminRegistrationResponse {
    id: string;
    email: string;
    papel: Papeis;
    message: string;
}

export interface ErrorResponse {
    error: string;
    code?: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
}

export interface SuccessResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

export interface Endereco {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export interface FuncionarioBase {
    id: string;
    email: string;
    nome: string;
    cpf: string;
    cns: string;
    dataNascimento: string;
    sexo: 'MASCULINO' | 'FEMININO' | 'OUTRO';
    racaCor: 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA';
    escolaridade: 'FUNDAMENTAL' | 'MEDIO' | 'SUPERIOR' | 'POS_GRADUACAO';
    telefone: string;
    endereco: Endereco;
}

export interface AdminRegistrationData extends Omit<FuncionarioBase, 'id'> {
    password: string;
    adminSecret: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface Database {
    public: {
        Tables: {
            funcionario: {
                Row: {
                    id: string;
                    email: string;
                    nome: string;
                    cpf: string;
                    cns: string;
                    data_nascimento: string;
                    sexo: 'MASCULINO' | 'FEMININO' | 'OUTRO';
                    raca_cor: 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA';
                    escolaridade: 'FUNDAMENTAL' | 'MEDIO' | 'SUPERIOR' | 'POS_GRADUACAO';
                    endereco_logradouro: string;
                    endereco_numero: string;
                    endereco_complemento: string | null;
                    endereco_bairro: string;
                    endereco_cidade: string;
                    endereco_estado: string;
                    endereco_cep: string;
                    telefone: string;
                    data_contratacao: string;
                    data_demissao: string | null;
                    ativo: boolean;
                    papel: Papeis;
                    created_at: string;
                    updated_at: string;
                };
            };
        };
    };
}
