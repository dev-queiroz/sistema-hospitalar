import {Request, Response} from 'express';
import {LeitoService} from '../service/LeitoService';
import {CreateLeitoDTO, UpdateLeitoDTO} from '../../dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class LeitoController {
    private leitoService: LeitoService;

    constructor() {
        this.leitoService = new LeitoService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateLeitoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const leito = await this.leitoService.createLeito(
                validated.numero,
                validated.quartoId,
                adminId
            );
            return res.status(201).json(leito);
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
            const leito = await this.leitoService.getLeito(id, usuarioId);
            if (!leito) return res.status(404).json({error: 'Leito não encontrado'});
            return res.json(leito);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const validated = UpdateLeitoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const leito = await this.leitoService.updateLeito(
                id,
                validated.numero,
                validated.disponivel,
                adminId
            );
            if (!leito) return res.status(404).json({error: 'Leito não encontrado'});
            return res.json(leito);
        } catch (error: any) {
            if (error instanceof z.ZodError) return res.status(400).json({errors: error.errors});
            return res.status(400).json({error: error.message});
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const success = await this.leitoService.deleteLeito(id, adminId);
            if (!success) return res.status(404).json({error: 'Leito não encontrado'});
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async listByQuarto(req: AuthenticatedRequest, res: Response) {
        try {
            const quartoId = req.params.quartoId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const leitos = await this.leitoService.listLeitosByQuarto(quartoId, usuarioId);
            return res.json(leitos);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async listDisponiveis(req: AuthenticatedRequest, res: Response) {
        try {
            const quartoId = req.params.quartoId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const leitos = await this.leitoService.listLeitosDisponiveis(quartoId, usuarioId);
            return res.json(leitos);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }
}