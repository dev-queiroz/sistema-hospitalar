import { Request, Response } from 'express';
import { TriagemService } from '../service/TriagemService';
import { CreateTriagemDTO } from '../../dtos';
import { z } from 'zod';
import { Papeis, NivelGravidade } from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class TriagemController {
    private triagemService: TriagemService;

    constructor() {
        this.triagemService = new TriagemService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateTriagemDTO.parse(req.body);
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const triagem = await this.triagemService.createTriagem(
                validated.pacienteId,
                enfermeiroId,
                validated.unidadeSaudeId,
                validated.sinaisVitais,
                validated.queixaPrincipal,
                validated.quartoId
            );
            return res.status(201).json(triagem);
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
            const triagem = await this.triagemService.getTriagem(id, usuarioId);
            if (!triagem) return res.status(404).json({ error: 'Triagem não encontrada' });
            return res.json(triagem);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response) {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const triagens = await this.triagemService.listTriagensByPaciente(pacienteId, usuarioId);
            return res.json(triagens);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listByGravidade(req: AuthenticatedRequest, res: Response) {
        try {
            const nivelGravidade = req.params.nivelGravidade as NivelGravidade;
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            // Validate nivelGravidade
            if (!Object.values(NivelGravidade).includes(nivelGravidade)) {
                throw new Error('Nível de gravidade inválido');
            }
            const pacientes = await this.triagemService.listPacientesByGravidade(nivelGravidade, unidadeSaudeId, usuarioId);
            return res.json(pacientes);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
