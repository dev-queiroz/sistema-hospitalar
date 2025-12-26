import { z } from 'zod';

export const LoginDTO = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const RegisterAdminDTO = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
    sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO'], { message: 'Sexo inválido' }),
    racaCor: z.enum(['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO'], { message: 'Raça/Cor inválida' }),
    escolaridade: z.enum(['SEM_ESCOLARIDADE', 'FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'], { message: 'Escolaridade inválida' }),
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

export const ForgotPasswordDTO = z.object({
    email: z.string().email('Email inválido')
});
