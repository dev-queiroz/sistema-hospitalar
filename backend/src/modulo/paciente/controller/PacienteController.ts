import {Request, Response} from 'express';
import {PacienteService} from '../service/PacienteService';
import {CreatePacienteDTO, UpdatePacienteDTO} from '../../core/dtos';
import {z} from 'zod';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class PacienteController {
    private pacienteService: PacienteService;

    constructor() {
        this.pacienteService = new PacienteService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreatePacienteDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.pacienteService.createPaciente(
                validated.nome,
                validated.cpf,
                validated.cns,
                new Date(validated.dataNascimento),
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.gruposRisco,
                validated.consentimentoLGPD,
                usuarioId,
                validated.email,
                validated.unidadeSaudeId
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar paciente'});
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

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.pacienteService.getPaciente(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Paciente não encontrado'});
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
            const validated = UpdatePacienteDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.pacienteService.updatePaciente(
                id,
                validated.nome,
                validated.cpf,
                validated.cns,
                validated.dataNascimento ? new Date(validated.dataNascimento) : undefined,
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.gruposRisco,
                validated.consentimentoLGPD,
                usuarioId,
                validated.email,
                validated.unidadeSaudeId
            );

            if (error || !data) {
                res.status(404).json({error: error?.message || 'Paciente não encontrado'});
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

            const {data, error} = await this.pacienteService.deletePaciente(id, usuarioId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar paciente'});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.pacienteService.listPacientes(usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async getHistorico(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.pacienteService.getPacienteHistorico(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Histórico não encontrado'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}