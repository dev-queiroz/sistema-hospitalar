import { z } from 'zod';
import {
    LoginCredentials,
    PasswordResetRequest,
    AdminRegistrationData,
    Endereco as IEndereco
} from '../types/auth.types';

const cpfValidator = (value: string) => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return false;

    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.substring(10, 11));
};

const cnsValidator = (value: string) => {
    const cns = value.replace(/\D/g, '');
    if (cns.length !== 15) return false;

    let sum = 0;
    for (let i = 0; i < 15; i++) {
        sum += parseInt(cns.charAt(i)) * (15 - i);
    }

    return sum % 11 === 0;
};

const dateOfBirthValidator = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const minAgeDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());

    return date <= minAgeDate;
};

const phoneValidator = (value: string) => {
    const phone = value.replace(/\D/g, '');
    return phone.length >= 10 && phone.length <= 11;
};

const cepValidator = (value: string) => {
    const cep = value.replace(/\D/g, '');
    return cep.length === 8;
};

const EnderecoSchema: z.ZodType<IEndereco> = z.object({
    logradouro: z.string().min(3, 'Logradouro deve ter pelo menos 3 caracteres'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(3, 'Bairro deve ter pelo menos 3 caracteres'),
    cidade: z.string().min(3, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
    cep: z.string()
        .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
        .refine(cepValidator, { message: 'CEP inválido' })
});

export const LoginDTO = z.object({
    email: z.string()
        .email('Email inválido')
        .max(100, 'Email muito longo'),
    password: z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .max(100, 'Senha muito longa')
}) satisfies z.ZodType<LoginCredentials>;

export const RegisterAdminDTO = z.object({
    email: z.string()
        .email('Email inválido')
        .max(100, 'Email muito longo'),
    password: z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .max(100, 'Senha muito longa')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
    nome: z.string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(100, 'Nome muito longo'),
    cpf: z.string()
        .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
        .refine(cpfValidator, { message: 'CPF inválido' }),
    cns: z.string()
        .regex(/^\d{15}$/, 'CNS deve ter 15 dígitos')
        .refine(cnsValidator, { message: 'CNS inválido' }),
    dataNascimento: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida')
        .refine(dateOfBirthValidator, { message: 'É necessário ter pelo menos 18 anos' }),
    sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
    racaCor: z.enum(['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA']),
    escolaridade: z.enum(['FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO']),
    endereco: EnderecoSchema,
    telefone: z.string()
        .refine(phoneValidator, { message: 'Telefone inválido' }),
    adminSecret: z.string()
        .min(1, 'Senha especial é obrigatória')
}) satisfies z.ZodType<Omit<AdminRegistrationData, 'id'>>;

export const ForgotPasswordDTO = z.object({
    email: z.string()
        .email('Email inválido')
        .max(100, 'Email muito longo')
}) satisfies z.ZodType<PasswordResetRequest>;

export const ResetPasswordDTO = z.object({
    email: z.string()
        .email('Email inválido')
        .max(100, 'Email muito longo')
});

export type LoginDTO = z.infer<typeof LoginDTO>;
export type RegisterAdminDTO = z.infer<typeof RegisterAdminDTO>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTO>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTO>;