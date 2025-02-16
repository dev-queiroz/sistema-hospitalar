import { Request, Response } from 'express';
import { UnidadeService } from '../service/UnidadeService';
import { IUnidade } from '../model/Unidade';

export class UnidadeController {
    private unidadeService: UnidadeService;

    constructor() {
        this.unidadeService = new UnidadeService();
    }

    /**
     * Cria uma nova unidade.
     */
    async criar(req: Request, res: Response): Promise<void> {
        try {
            const unidadeData: IUnidade = req.body;
            const novaUnidade = await this.unidadeService.criarUnidade(unidadeData);
            res.status(201).json(novaUnidade);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Lista todas as unidades cadastradas.
     */
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const unidades = await this.unidadeService.listarUnidades();
            res.status(200).json(unidades);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Busca uma unidade pelo ID.
     */
    async buscarPorId(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            const unidade = await this.unidadeService.listarUnidadePorId(id);
            res.status(200).json(unidade);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Atualiza os dados de uma unidade.
     */
    async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            const unidadeData: Partial<IUnidade> = req.body;
            const unidadeAtualizada = await this.unidadeService.atualizarUnidade(id, unidadeData);
            res.status(200).json(unidadeAtualizada);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Exclui uma unidade pelo ID.
     */
    async excluir(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            await this.unidadeService.excluirUnidade(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
