import { Request, Response } from 'express';
import { QuartoService } from '../service/QuartoService';
import { CreateQuartoDTO, UpdateQuartoDTO } from '../../dtos';
import { z } from 'zod';
import { Papeis } from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class QuartoController {
    private quartoService: QuartoService;

    constructor() {
        this.quartoService = new QuartoService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateQuartoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const quarto = await this.quartoService.createQuarto(
                validated.numero,
                validated.unidadeSaudeId,
                adminId
            );
            return res.status(201).json(quarto);
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
            const quarto = await this.quartoService.getQuarto(id, usuarioId);
            if (!quarto) return res.status(404).json({ error: 'Quarto não encontrado' });
            return res.json(quarto);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const validated = UpdateQuartoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const quarto = await this.quartoService.updateQuarto(
                id,
                validated.numero,
                adminId
            );
            if (!quarto) return res.status(404).json({ error: 'Quarto não encontrado' });
            return res.json(quarto);
        } catch (error: any) {
            if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
            return res.status(400).json({ error: error.message });
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const success = await this.quartoService.deleteQuarto(id, adminId);
            if (!success) return res.status(404).json({ error: 'Quarto não encontrado' });
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listByUnidade(req: AuthenticatedRequest, res: Response) {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const quartos = await this.quartoService.listQuartosByUnidade(unidadeSaudeId, usuarioId);
            return res.json(quartos);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
