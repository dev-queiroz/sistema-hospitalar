import { Request, Response } from 'express';
import * as triagemService from '../services/triagemService';
import { handleError } from '../../../utils/errorHandler';

export const HandlerRealizarTriagem = async (req: Request, res: Response) => {
    try {
        const triagem = await triagemService.realizarTriagem(req.body);
        res.status(201).json(triagem);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerGetQueue = async (req: Request, res: Response) => {
    try {
        const queue = await triagemService.getQueue();
        res.status(200).json(queue);
    } catch (error) {
        handleError(res, 500, (error as Error).message);
    }
};