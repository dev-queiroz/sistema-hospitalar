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

            const {data, error} = await this.triagemService.createTriagem(
                validated.pacienteId,
                enfermeiroId,
                validated.unidadeSaudeId,
                validated.sinaisVitais,
                validated.queixaPrincipal
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar triagem'});
                return;
            }
            res.status(201).json(data);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.triagemService.getAllTriagens(usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Nenhuma triagem encontrada'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.triagemService.getTriagem(id);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Triagem não encontrada'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.triagemService.listTriagensByPaciente(pacienteId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
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
                throw new Error('Nível de gravidade inválido');
            }

            const {
                data,
                error
            } = await this.triagemService.listPacientesByGravidade(nivelGravidade, unidadeSaudeId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
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

            const {
                data,
                error
            } = await this.triagemService.updateTriagem(id, validated.nivelGravidade, validated.sinaisVitais, validated.queixaPrincipal, enfermeiroId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Triagem não encontrada'});
                return;
            }
            res.json(data);
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

            const {data, error} = await this.triagemService.deleteTriagem(id);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar triagem'});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}