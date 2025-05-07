import {Request, Response} from 'express';
import {ConsultaService} from '../service/ConsultaService';
import {CreateConsultaDTO} from '../../dtos';
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

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateConsultaDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consulta = await this.consultaService.createConsulta(
                validated.pacienteId,
                validated.profissionalId,
                validated.unidadeSaudeId,
                validated.observacoes,
                validated.quartoId,
                validated.cid10
            );
            return res.status(201).json(consulta);
        } catch (error: any) {
            if (error instanceof z.ZodError) return res.status(400).json({errors: error.errors});
            return res.status(400).json({error: error.message});
        }
    }

    async get(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consulta = await this.consultaService.getConsulta(id, usuarioId);
            if (!consulta) return res.status(404).json({error: 'Consulta não encontrada'});
            return res.json(consulta);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response) {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const consultas = await this.consultaService.listConsultasByPaciente(pacienteId, usuarioId);
            return res.json(consultas);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async listByProfissional(req: AuthenticatedRequest, res: Response) {
        try {
            const profissionalId = req.params.profissionalId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const consultas = await this.consultaService.listConsultasByProfissional(profissionalId, adminId);
            return res.json(consultas);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async listAtendimentosAtivos(req: AuthenticatedRequest, res: Response) {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const consultas = await this.consultaService.listAtendimentosAtivos(unidadeSaudeId, adminId);
            return res.json(consultas);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }
}