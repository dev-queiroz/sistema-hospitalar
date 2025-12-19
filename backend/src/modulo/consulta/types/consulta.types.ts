import { CreateConsultaDTO, UpdateConsultaDTO, ListConsultasParams } from '../dto/consulta.dto';

export interface Consulta {
    id: string;
    paciente_id: string;
    profissional_id: string;
    unidade_saude_id: string;
    data_consulta: string;
    observacoes: string;
    cid10?: string;
    status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
    ativo: boolean;
    criado_em: string;
    atualizado_em?: string;
}

export interface IConsultaService {
    createConsulta(data: CreateConsultaDTO, usuarioId: string): Promise<{ data: Consulta | null; error: Error | null }>;
    getConsulta(id: string, usuarioId: string): Promise<{ data: Consulta | null; error: Error | null }>;
    updateConsulta(data: UpdateConsultaDTO, usuarioId: string): Promise<{ data: Consulta | null; error: Error | null }>;
    deleteConsulta(id: string, usuarioId: string): Promise<{ error: Error | null }>;
    listConsultas(params: ListConsultasParams, usuarioId: string): Promise<{ data: Consulta[]; error: Error | null }>;
}

export interface IConsultaController {
    create(req: any, res: any): Promise<void>;
    get(req: any, res: any): Promise<void>;
    update(req: any, res: any): Promise<void>;
    delete(req: any, res: any): Promise<void>;
    list(req: any, res: any): Promise<void>;
    listByPaciente(req: any, res: any): Promise<void>;
    listByProfissional(req: any, res: any): Promise<void>;
}