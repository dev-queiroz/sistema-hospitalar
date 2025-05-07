import { Request, Response } from 'express';
import { ProntuarioService } from '../service/ProntuarioService';
import { CreateProntuarioDTO } from '../../dtos';
import { z } from 'zod';
import { Papeis } from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class ProntuarioController {
    private prontuarioService: ProntuarioService;

    constructor() {
        this.prontuarioService = new ProntuarioService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prontuario = await this.prontuarioService.createProntuario(
                validated.pacienteId,
                validated.profissionalId,
                validated.descricao,
                validated.dadosAnonimizados
            );
            return res.status(201).json(prontuario);
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
            const prontuario = await this.prontuarioService.getProntuario(id, usuarioId);
            if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });
            return res.json(prontuario);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response) {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prontuarios = await this.prontuarioService.listProntuariosByPaciente(pacienteId, usuarioId);
            return res.json(prontuarios);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
