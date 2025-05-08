import {Request, Response} from 'express';
import {TriagemService} from '../service/TriagemService';
import {CreateTriagemDTO, UpdateTriagemDTO} from '../../core/dtos';
import {z} from 'zod';
import {NivelGravidade, Papeis} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class TriagemController {
    private triagemService: TriagemService;

    constructor() {
        this.triagemService = new TriagemService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateTriagemDTO.parse(req.body);
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const triagem = await this.triagemService.createTriagem(
                validated.pacienteId,
                enfermeiroId,
                validated.unidadeSaudeId,
                validated.sinaisVitais,
                validated.queixaPrincipal
            );
            res.status(201).json(triagem);
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
            const triagem = await this.triagemService.getTriagem(id, usuarioId);
            if (!triagem) {
                res.status(404).json({error: 'Triagem não encontrada'});
                return;
            }
            res.json(triagem);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const triagens = await this.triagemService.listTriagensByPaciente(pacienteId, usuarioId);
            res.json(triagens);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByGravidade(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const nivelGravidade = req.params.nivelGravidade as NivelGravidade;
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            if (!Object.values(NivelGravidade).includes(nivelGravidade)) {
                res.status(400).json({error: 'Nível de gravidade inválido'});
                return;
            }
            const pacientes = await this.triagemService.listPacientesByGravidade(
                nivelGravidade,
                unidadeSaudeId,
                usuarioId
            );
            res.json(pacientes);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdateTriagemDTO.parse(req.body);
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const triagem = await this.triagemService.updateTriagem(
                id,
                validated.sinaisVitais,
                validated.queixaPrincipal,
                enfermeiroId
            );
            if (!triagem) {
                res.status(404).json({error: 'Triagem não encontrada'});
                return;
            }
            res.json(triagem);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const success = await this.triagemService.deleteTriagem(id, enfermeiroId);
            if (!success) {
                res.status(404).json({error: 'Triagem não encontrada'});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}