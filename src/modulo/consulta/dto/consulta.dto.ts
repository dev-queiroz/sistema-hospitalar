import { z } from 'zod';

export const CreateConsultaDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    observacoes: z.string().optional(),
    cid10: z.string().optional(),
});

export const UpdateConsultaDTO = z.object({
    id: z.string().uuid('ID da consulta inválido'),
    observacoes: z.string().optional(),
    cid10: z.string().optional(),
    status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA']).optional(),
});

export const ListConsultasParams = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido').optional(),
    profissionalId: z.string().uuid('ID do profissional inválido').optional(),
    status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA']).optional(),
    dataInicio: z.string().datetime('Data de início inválida').optional(),
    dataFim: z.string().datetime('Data de fim inválida').optional(),
});

export type CreateConsultaDTO = z.infer<typeof CreateConsultaDTO>;
export type UpdateConsultaDTO = z.infer<typeof UpdateConsultaDTO>;
export type ListConsultasParams = z.infer<typeof ListConsultasParams>;
