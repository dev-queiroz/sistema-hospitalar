import { Request, Response } from 'express';
import { Server } from 'socket.io';
import * as pepService from '../services/pepService';
import { handleError } from '../../../utils/errorHandler';
import { supabase } from '../../../config/supabase';

let io: Server | null = null;

export const initWebSocket = (socketIo: Server) => {
    io = socketIo;
    pepService.subscribeToProntuarioChanges(null, (payload) => {
        io?.emit('prontuarioUpdate', payload);
    });
};

export const HandlerCreateProntuario = async (req: Request, res: Response) => {
    try {
        const { patient_id, history } = req.body;
        if (!patient_id || !history) throw new Error('patient_id e history são obrigatórios');

        const prontuario = await pepService.createProntuario({ patient_id, history });
        res.status(201).json(prontuario);
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};

export const HandlerGetProntuario = async (req: Request, res: Response) => {
    try {
        const prontuario = await pepService.getProntuario(req.params.patientId);
        if (!prontuario) throw new Error('Prontuário não encontrado');
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

        if (req.user?.role === 'patient') throw new Error('Apenas profissionais podem listar prontuários');

        const { data, error, count } = await supabase
            .from('prontuarios')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);
        if (error) throw new Error(error.message);

        res.status(200).json({ data, page, limit, total: count, totalPages: Math.ceil(count! / limit) });
    } catch (error) {
        handleError(res, req.user?.role === 'patient' ? 403 : 500, (error as Error).message);
    }
};

export const HandlerStartRealtime = async (req: Request, res: Response) => {
    try {
        const patientId = req.query.patientId as string | undefined;
        if (!io) throw new Error('WebSocket não inicializado');
        res.status(200).json({ message: `Realtime iniciado${patientId ? ` para ${patientId}` : ''}` });
    } catch (error) {
        handleError(res, 500, (error as Error).message);
    }
};

export const HandlerCallPatient = async (req: Request, res: Response) => {
    try {
        const identifier = req.query.identifier as string;
        if (!identifier) throw new Error('sus_number ou cpf é necessário');

        const patient = await pepService.getPatientByIdentifier(identifier);
        const prontuario = await pepService.getProntuario(patient.id) || { patient_id: patient.id, history: {} };
        res.status(200).json({ patient, prontuario });
    } catch (error) {
        handleError(res, 404, (error as Error).message);
    }
};

export const HandlerAttendPatient = async (req: Request, res: Response) => {
    try {
        const { identifier, historyUpdate, prescription, referral } = req.body;
        if (!identifier || !historyUpdate) throw new Error('identifier e historyUpdate são obrigatórios');

        const patient = await pepService.getPatientByIdentifier(identifier);
        const updatedProntuario = await pepService.updateProntuario(patient.id, historyUpdate);

        if (prescription) {
            await supabase.from('prescricoes').insert({ patient_id: patient.id, professional_id: req.user?.id, detalhes: prescription });
        }
        if (referral) {
            await supabase.from('encaminhamentos').insert({ patient_id: patient.id, professional_id: req.user?.id, ...referral });
        }

        res.status(200).json({ prontuario: updatedProntuario, message: 'Atendimento registrado' });
    } catch (error) {
        handleError(res, 400, (error as Error).message);
    }
};