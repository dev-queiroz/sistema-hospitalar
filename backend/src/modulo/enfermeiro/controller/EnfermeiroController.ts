import {Request, Response} from 'express';
import {EnfermeiroService} from '../service/EnfermeiroService';
import {CreateEnfermeiroDTO, UpdateEnfermeiroDTO} from '../../core/dtos';
import {z} from 'zod';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class EnfermeiroController {
    private enfermeiroService: EnfermeiroService;

    constructor() {
        this.enfermeiroService = new EnfermeiroService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateEnfermeiroDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const enfermeiro = await this.enfermeiroService.createEnfermeiro(
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
                validated.coren,
                adminId
            );
            res.status(201).json(enfermeiro);
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
            const enfermeiro = await this.enfermeiroService.getEnfermeiro(id, usuarioId);
            if (!enfermeiro) {
                res.status(404).json({error: 'Enfermeiro não encontrado'});
                return;
            }
            res.json(enfermeiro);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdateEnfermeiroDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const enfermeiro = await this.enfermeiroService.updateEnfermeiro(
                id,
                validated.nome,
                validated.coren,
                validated.dataContratacao,
                adminId
            );
            if (!enfermeiro) {
                res.status(404).json({error: 'Enfermeiro não encontrado'});
                return;
            }
            res.json(enfermeiro);
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
            const success = await this.enfermeiroService.deleteEnfermeiro(id, adminId);
            if (!success) {
                res.status(404).json({error: 'Enfermeiro não encontrado'});
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
            const enfermeiros = await this.enfermeiroService.listEnfermeiros(usuarioId);
            res.json(enfermeiros);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}