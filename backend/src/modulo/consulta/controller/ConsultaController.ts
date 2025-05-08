import {Request, Response} from 'express';
import {ConsultaService} from '../service/ConsultaService';
import {CreateConsultaDTO} from '../../core/dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class ConsultaController {
    private consultaService: ConsultaService;

    constructor() {
        this.consultaService = new ConsultaService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateConsultaDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consulta = await this.consultaService.createConsulta(
                validated.pacienteId,
                validated.profissionalId,
                validated.unidadeSaudeId,
                validated.observacoes,
                validated.cid10
            );
            res.status(201).json(consulta);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consulta = await this.consultaService.getConsulta(id, usuarioId);
            if (!consulta) {
                res.status(404).json({error: 'Consulta não encontrada'});
                return;
            }
            res.json(consulta);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consultas = await this.consultaService.listConsultasByPaciente(pacienteId, usuarioId);
            res.json(consultas);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByProfissional(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const profissionalId = req.params.profissionalId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const consultas = await this.consultaService.listConsultasByProfissional(profissionalId, adminId);
            res.json(consultas);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listAtendimentosAtivos(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const consultas = await this.consultaService.listAtendimentosAtivos(unidadeSaudeId, adminId);
            res.json(consultas);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByUnidadeSaude(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const consultas = await this.consultaService.listConsultasByUnidadeSaude(unidadeSaudeId, adminId);
            res.json(consultas);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}