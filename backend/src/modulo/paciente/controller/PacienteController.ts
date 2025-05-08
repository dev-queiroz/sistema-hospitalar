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
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const paciente = await this.pacienteService.createPaciente(
                validated.nome,
                validated.cpf,
                validated.cns,
                validated.dataNascimento,
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.gruposRisco,
                validated.consentimentoLGPD,
                enfermeiroId,
                validated.email
            );
            res.status(201).json(paciente);
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
            const paciente = await this.pacienteService.getPaciente(id, usuarioId);
            if (!paciente) {
                res.status(404).json({error: 'Paciente não encontrado'});
                return;
            }
            res.json(paciente);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdatePacienteDTO.parse(req.body);
            const enfermeiroId = req.user?.id;
            if (!enfermeiroId) throw new Error('ID do enfermeiro não encontrado');
            const paciente = await this.pacienteService.updatePaciente(
                id,
                validated.nome,
                validated.cpf,
                validated.cns,
                validated.dataNascimento,
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.gruposRisco,
                validated.consentimentoLGPD,
                enfermeiroId,
                validated.email
            );
            if (!paciente) {
                res.status(404).json({error: 'Paciente não encontrado'});
                return;
            }
            res.json(paciente);
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
            const success = await this.pacienteService.deletePaciente(id, enfermeiroId);
            if (!success) {
                res.status(404).json({error: 'Paciente não encontrado'});
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
            const pacientes = await this.pacienteService.listPacientes(usuarioId);
            res.json(pacientes);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async getHistorico(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const historico = await this.pacienteService.getPacienteHistorico(id, usuarioId);
            if (!historico) {
                res.status(404).json({error: 'Histórico não encontrado'});
                return;
            }
            res.json(historico);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async search(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {cpfOrCns} = req.query;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            if (typeof cpfOrCns !== 'string') throw new Error('cpfOrCns deve ser uma string');
            const pacientes = await this.pacienteService.searchPacientesByCpfOrCns(cpfOrCns, usuarioId);
            res.json(pacientes);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}