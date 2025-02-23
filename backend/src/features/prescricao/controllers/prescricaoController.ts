import { Request, Response } from 'express';
import * as prescricaoService from '../services/prescricaoService';
import { handleError } from '../../../utils/errorHandler';

export const HandlerCriarPrescricao = async (req: Request, res: Response) => {
    try {
        const prescricao = await prescricaoService.criarPrescricao(req.body);
        res.status(201).json(prescricao);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerCriarEncaminhamento = async (req: Request, res: Response) => {
    try {
        const encaminhamento = await prescricaoService.criarEncaminhamento(req.body);
        res.status(201).json(encaminhamento);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};