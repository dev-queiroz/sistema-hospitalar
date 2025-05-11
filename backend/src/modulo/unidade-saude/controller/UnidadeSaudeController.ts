import {Request, Response} from 'express';
import {UnidadeSaudeService} from '../service/UnidadeSaudeService';
import {CreateUnidadeSaudeDTO, UpdateUnidadeSaudeDTO} from '../../core/dtos';
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

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateUnidadeSaudeDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.unidadeSaudeService.createUnidadeSaude(
                validated.nome,
                validated.tipo,
                validated.cnes,
                validated.endereco,
                validated.telefone,
                validated.servicosEssenciais,
                validated.servicosAmpliados ?? [],
                adminId
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar unidade'});
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

            const {data, error} = await this.unidadeSaudeService.getUnidadeSaude(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Unidade de saúde não encontrada'});
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
            const validated = UpdateUnidadeSaudeDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.unidadeSaudeService.updateUnidadeSaude(
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

            if (error || !data) {
                res.status(404).json({error: error?.message || 'Unidade de saúde não encontrada'});
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
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.unidadeSaudeService.deleteUnidadeSaude(id, adminId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao deletar unidade'});
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

            const {data, error} = await this.unidadeSaudeService.listUnidadesSaude(usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listFuncionariosByUnidade(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.unidadeSaudeService.listFuncionariosByUnidade(unidadeSaudeId, adminId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async associarFuncionario(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.params.unidadeSaudeId;
            const funcionarioId = req.body.funcionarioId;
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.unidadeSaudeService.associarFuncionarioUnidade(unidadeSaudeId, funcionarioId, adminId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}