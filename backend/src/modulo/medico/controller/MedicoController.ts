import {Request, Response} from 'express';
import {MedicoService} from '../service/MedicoService';
import {CreateMedicoDTO, UpdateMedicoDTO} from '../../core/dtos';
import {z} from 'zod';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class MedicoController {
    private medicoService: MedicoService;

    constructor() {
        this.medicoService = new MedicoService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateMedicoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const medico = await this.medicoService.createMedico(
                validated.nome,
                validated.cpf,
                validated.cns,
                validated.dataNascimento,
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.email,
                validated.dataContratacao,
                validated.crm,
                adminId
            );
            res.status(201).json(medico);
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
            const medico = await this.medicoService.getMedico(id, usuarioId);
            if (!medico) {
                res.status(404).json({error: 'Médico não encontrado'});
                return;
            }
            res.json(medico);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdateMedicoDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const medico = await this.medicoService.updateMedico(
                id,
                validated.nome,
                validated.crm,
                validated.dataContratacao,
                adminId
            );
            if (!medico) {
                res.status(404).json({error: 'Médico não encontrado'});
                return;
            }
            res.json(medico);
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
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const success = await this.medicoService.deleteMedico(id, adminId);
            if (!success) {
                res.status(404).json({error: 'Médico não encontrado'});
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
            const medicos = await this.medicoService.listMedicos(usuarioId);
            res.json(medicos);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}