import { Request, Response } from 'express';
import { PrescricaoService } from '../service/PrescricaoService';
import { CreatePrescricaoDTO } from '../../dtos';
import { z } from 'zod';
import { Papeis } from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class PrescricaoController {
    private prescricaoService: PrescricaoService;

    constructor() {
        this.prescricaoService = new PrescricaoService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreatePrescricaoDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.createPrescricao(
                validated.pacienteId,
                validated.profissionalId,
                validated.detalhesPrescricao,
                validated.cid10
            );
            return res.status(201).json(prescricao);
        } catch (error: any) {
            if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
            return res.status(400).json({ error: error.message });
        }
    }

    async get(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.getPrescricao(id, usuarioId);
            if (!prescricao) return res.status(404).json({ error: 'Prescrição não encontrada' });
            return res.json(prescricao);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response) {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricoes = await this.prescricaoService.listPrescricoesByPaciente(pacienteId, usuarioId);
            return res.json(prescricoes);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
