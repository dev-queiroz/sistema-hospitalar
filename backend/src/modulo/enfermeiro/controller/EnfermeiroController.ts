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

            const {data, error} = await this.enfermeiroService.createEnfermeiro(
                validated.nome,
                validated.cpf,
                validated.cns,
                new Date(validated.dataNascimento),
                validated.sexo as Sexo,
                validated.racaCor as RacaCor,
                validated.escolaridade as Escolaridade,
                validated.endereco,
                validated.telefone,
                validated.email,
                validated.senha,
                new Date(validated.dataContratacao),
                validated.coren,
                adminId,
                validated.unidadeSaudeId // Correto, pois está no DTO
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar enfermeiro'});
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

            const {data, error} = await this.enfermeiroService.getEnfermeiro(id);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Enfermeiro não encontrado'});
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
            const validated = UpdateEnfermeiroDTO.parse(req.body);
            const adminId = req.user?.id;
            if (!adminId) throw new Error('ID do administrador não encontrado');

            const {data, error} = await this.enfermeiroService.updateEnfermeiro(
                id,
                validated.nome,
                validated.coren,
                validated.dataContratacao ? new Date(validated.dataContratacao) : undefined,
                adminId
            );

            if (error || !data) {
                res.status(404).json({error: error?.message || 'Enfermeiro não encontrado'});
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

            const {data, error} = await this.enfermeiroService.deleteEnfermeiro(id, adminId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar enfermeiro'});
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

            const {data, error} = await this.enfermeiroService.listEnfermeiros(usuarioId);
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