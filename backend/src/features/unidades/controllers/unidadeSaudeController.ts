import { Request, Response } from 'express';
import * as unidadeSaudeService from '../services/unidadeSaudeService';

export const HandlerCreateUnidadeSaude = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') throw new Error('Acesso negado');
        const unidade = await unidadeSaudeService.createUnidadeSaude(req.body);
        res.status(201).json(unidade);
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

export const HandlerGetUnidadesSaude = async (req: Request, res: Response) => {
    try {
        const unidades = await unidadeSaudeService.getUnidadesSaude();
        res.status(200).json(unidades);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const HandlerUpdateUnidadeSaude = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') throw new Error('Acesso negado');
        const { id } = req.params;
        const unidade = await unidadeSaudeService.updateUnidadeSaude(id, req.body);
        res.status(200).json(unidade);
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

export const HandlerDeleteUnidadeSaude = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') throw new Error('Acesso negado');
        const { id } = req.params;
        const result = await unidadeSaudeService.deleteUnidadeSaude(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};