import {Request, Response} from 'express';
import {UnidadeSaudeService} from '../service/UnidadeSaudeService';
import {CreateUnidadeSaudeDTO, UpdateUnidadeSaudeDTO} from '../../dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class UnidadeSaudeController {
    private unidadeSaudeService: UnidadeSaudeService;

    constructor() {
        this.unidadeSaudeService = new UnidadeSaudeService();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = CreateUnidadeSaudeDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const unidade = await this.unidadeSaudeService.createUnidadeSaude(
                validated.nome,
                validated.tipo,
                validated.cnes,
                validated.endereco,
                validated.telefone,
                validated.servicosEssenciais,
                validated.servicosAmpliados ?? [],
                adminId
            );
            return res.status(201).json(unidade);
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
            const unidade = await this.unidadeSaudeService.getUnidadeSaude(id, usuarioId);
            if (!unidade) return res.status(404).json({error: 'Unidade de saúde não encontrada'});
            return res.json(unidade);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id;
            const validated = UpdateUnidadeSaudeDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');
            const unidade = await this.unidadeSaudeService.updateUnidadeSaude(
                id,
                validated.nome,
                validated.tipo,
                validated.cnes,
                validated.endereco,
                validated.telefone,
                validated.servicosEssenciais,
                validated.servicosAmpliados,
                adminId
            );
            if (!unidade) return res.status(404).json({error: 'Unidade de saúde não encontrada'});
            return res.json(unidade);
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
            const success = await this.unidadeSaudeService.deleteUnidadeSaude(id, adminId);
            if (!success) return res.status(404).json({error: 'Unidade de saúde não encontrada'});
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }

    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const unidades = await this.unidadeSaudeService.listUnidadesSaude(usuarioId);
            return res.json(unidades);
        } catch (error: any) {
            return res.status(400).json({error: error.message});
        }
    }
}