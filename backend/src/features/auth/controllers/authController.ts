import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { handleError } from '../../../utils/errorHandler';

export const HandlerRegisterPatient = async (req: Request, res: Response) => {
    try {
        const patient = await authService.registerPatient(req.body);
        res.status(201).json(patient);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerRegisterProfessional = async (req: Request, res: Response) => {
    try {
        const professional = await authService.registerProfessional(req.body);
        res.status(201).json(professional);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerRegisterAdmin = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') throw new Error('Acesso negado');
        const admin = await authService.registerAdmin(req.body);
        res.status(201).json(admin);
    } catch (error) {
        handleError(res, 403, (error as Error).message);
    }
};

export const HandlerLogin = async (req: Request, res: Response) => {
    try {
        const { user, token } = await authService.login(req.body);
        res.status(200).json({ user, token });
    } catch (error) {
        handleError(res, 401, (error as Error).message);
    }
};