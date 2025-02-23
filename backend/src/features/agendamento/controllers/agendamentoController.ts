import { Request, Response } from 'express';
import * as agendamentoService from '../services/agendamentoService';
import { handleError } from '../../../utils/errorHandler';

export const HandlerCriarAgendamento = async (req: Request, res: Response) => {
    try {
        const agendamento = await agendamentoService.criarAgendamento(req.body);
        res.status(201).json(agendamento);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};