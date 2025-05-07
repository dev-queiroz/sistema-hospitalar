import {Request, Response} from 'express';
import {EnfermeiroService} from '../service/EnfermeiroService';
import {CreateEnfermeiroDTO, UpdateEnfermeiroDTO} from '../../dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class EnfermeiroController {
    private enfermeiroService: EnfermeiroService;

    constructor() {
        this.enfermeiroService = new EnfermeiroService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateEnfermeiroDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const enfermeiro = await this.enfermeiroService.createEnfermeiro(
                validated.nome,
                validated.cpf,
                validated.cns,
                validated.dataNascimento,
                validated.sexo,
                validated.racaCor,
                validated.escolaridade,
                validated.endereco,
                validated.telefone,
                validated.email,
                validated.dataContratacao,
                validated.coren,
                adminId
            );
            return res.status(201).json(enfermeiro);
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
            const enfermeiro = await this.enfermeiroService.getEnfermeiro(id, usuarioId);
            if (!enfermeiro) return res.status(404).json({error: 'Enfermeiro não encontrado'});
            return res.json(enfermeiro);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
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
            if (!enfermeiro) return res.status(404).json({error: 'Enfermeiro não encontrado'});
            return res.json(enfermeiro);
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
            const success = await this.enfermeiroService.deleteEnfermeiro(id, adminId);
            if (!success) return res.status(404).json({error: 'Enfermeiro não encontrado'});
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const enfermeiros = await this.enfermeiroService.listEnfermeiros(usuarioId);
            return res.json(enfermeiros);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }
}