import { Request, Response } from 'express';
import { Server } from 'socket.io';
import * as pepService from '../services/pepService';
import { handleError } from '../../../utils/errorHandler';
import { Prontuario } from '../models/prontuario';
import { supabase } from '../../../config/supabase';

let io: Server | null = null;

export const initWebSocket = (socketIo: Server) => {
    io = socketIo;

    pepService.subscribeToProntuarioChanges(null, (payload) => {
        console.log('Realtime update:', payload);
        io?.emit('prontuarioUpdate', payload);
    });
};

export const HandlerCreateProntuario = async (req: Request, res: Response) => {
    try {
        const { patient_id, history } = req.body;

        if (!patient_id || !history) {
            return handleError(res, 400, 'patient_id e history são obrigatórios');
        }

        const { data: patientExists, error: patientError } = await supabase
            .from('patients')
            .select('id')
            .eq('id', patient_id)
            .single();
        if (patientError || !patientExists) {
            return handleError(res, 404, 'Paciente não encontrado');
        }

        const prontuarioData: Prontuario = { patient_id, history };
        const prontuario = await pepService.createProntuario(prontuarioData);
        res.status(201).json(prontuario);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerGetProntuario = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return handleError(res, 400, 'patientId é obrigatório');
        }

        const prontuario = await pepService.getProntuario(patientId);
        if (!prontuario) {
            return handleError(res, 404, 'Prontuário não encontrado');
        }

        res.status(200).json(prontuario);
    } catch (error) {
        handleError(res, 404, (error as Error).message);
    }
};

export const HandlerListProntuarios = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const userRole = req.user?.role;
        if (userRole === 'patient') {
            return handleError(res, 403, 'Apenas profissionais podem listar todos os prontuários');
        }

        const { data, error, count } = await supabase
            .from('prontuarios')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);

        if (error) throw new Error(error.message);

        res.status(200).json({
            data,
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count! / limit),
        });
    } catch (error) {
        handleError(res, 500, (error as Error).message);
    }
};

export const HandlerStartRealtime = async (req: Request, res: Response) => {
    try {
        const patientId = req.query.patientId as string | undefined;

        if (patientId) {
            const { data: patientExists, error: patientError } = await supabase
                .from('patients')
                .select('id')
                .eq('id', patientId)
                .single();
            if (patientError || !patientExists) {
                return handleError(res, 404, 'Paciente não encontrado');
            }
        }

        if (!io) {
            return handleError(res, 500, 'WebSocket server não inicializado');
        }

        res.status(200).json({
            message: `Realtime subscription started for prontuarios${patientId ? ` (patient: ${patientId})` : ''}`,
        });
    } catch (error) {
        handleError(res, 500, (error as Error).message);
    }
};