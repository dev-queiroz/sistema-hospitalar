import {Request, Response} from 'express';
import {ConsultaService} from '../service/ConsultaService';
import {CreateConsultaDTO, UpdateConsultaDTO} from '../../core/dtos';
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

            const {data, error} = await this.consultaService.createConsulta(
                validated.pacienteId,
                usuarioId,
                validated.unidadeSaudeId,
                validated.observacoes,
                validated.cid10
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar consulta'});
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

            const {data, error} = await this.consultaService.getAllConsultas(usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
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

            const {data, error} = await this.consultaService.getConsulta(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Consulta não encontrada'});
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

            const {data, error} = await this.consultaService.listConsultasByPaciente(pacienteId, usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByProfissional(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const profissionalId = req.params.profissionalId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.consultaService.listConsultasByProfissional(profissionalId, adminId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listAtendimentosAtivos(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.consultaService.listAtendimentosAtivos(unidadeSaudeId, adminId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByUnidadeSaude(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.consultaService.listConsultasByUnidadeSaude(unidadeSaudeId, adminId);
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
            const validated = UpdateConsultaDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {
                data,
                error
            } = await this.consultaService.updateConsulta(id, validated.observacoes, validated.cid10, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Consulta não encontrada'});
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
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.consultaService.deleteConsulta(id, usuarioId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar consulta'});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}