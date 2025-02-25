import { Request, Response } from 'express';
import * as professionalService from '../services/professionalService';
import { handleError } from '../../../utils/errorHandler';

export const HandlerAllocateProfessional = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') throw new Error('Acesso negado');
        const { professionalId, unidadeSaudeId } = req.body;
        const professional = await professionalService.allocateProfessional(professionalId, unidadeSaudeId);
        res.status(200).json(professional);
    } catch (error) {
        handleError(res, 403, (error as Error).message);
    }
};