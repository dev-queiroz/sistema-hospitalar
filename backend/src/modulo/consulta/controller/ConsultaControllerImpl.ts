import { Request, Response } from 'express';
import { IConsultaController } from '../types/consulta.types';
import { ConsultaServiceImpl } from '../service/ConsultaServiceImpl';
import { 
    CreateConsultaDTO, 
    UpdateConsultaDTO, 
    ListConsultasParams 
} from '../dto/consulta.dto';
import { ConsultaErrorHandler } from '../utils/error-handler';

export class ConsultaController implements IConsultaController {
    private consultaService: ConsultaServiceImpl;

    constructor() {
        this.consultaService = new ConsultaServiceImpl();
    }

    /**
     * Create a new consultation
     */
    async create(req: any, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const data = CreateConsultaDTO.parse(req.body);
            const { data: consulta, error } = await this.consultaService.createConsulta(data, usuarioId);
            
            if (error || !consulta) {
                throw error || new Error('Erro ao criar consulta');
            }

            ConsultaErrorHandler.sendSuccess(res, consulta, 201);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * Get a consultation by ID
     */
    async get(req: any, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;
            
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const { data: consulta, error } = await this.consultaService.getConsulta(id, usuarioId);
            
            if (error || !consulta) {
                ConsultaErrorHandler.handleNotFound(res, 'Consulta não encontrada');
                return;
            }

            ConsultaErrorHandler.sendSuccess(res, consulta);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * Update a consultation
     */
    async update(req: any, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const data = UpdateConsultaDTO.parse({ ...req.body, id: req.params.id });
            const { data: consulta, error } = await this.consultaService.updateConsulta(data, usuarioId);
            
            if (error || !consulta) {
                throw error || new Error('Erro ao atualizar consulta');
            }

            ConsultaErrorHandler.sendSuccess(res, consulta);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * Delete a consultation
     */
    async delete(req: any, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;
            
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const { error } = await this.consultaService.deleteConsulta(id, usuarioId);
            
            if (error) {
                throw error;
            }

            ConsultaErrorHandler.sendSuccess(res, { success: true });
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * List all consultations
     */
    async list(req: any, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const params = ListConsultasParams.parse(req.query);
            const { data: consultas, error } = await this.consultaService.listConsultas(params, usuarioId);
            
            if (error) {
                throw error;
            }

            ConsultaErrorHandler.sendSuccess(res, consultas);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * List consultations by patient
     */
    async listByPaciente(req: any, res: Response): Promise<void> {
        try {
            const { pacienteId } = req.params;
            const usuarioId = req.user?.id;
            
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const { data: consultas, error } = await this.consultaService.listConsultas(
                { pacienteId },
                usuarioId
            );
            
            if (error) {
                throw error;
            }

            ConsultaErrorHandler.sendSuccess(res, consultas);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }

    /**
     * List consultations by professional
     */
    async listByProfissional(req: any, res: Response): Promise<void> {
        try {
            const { profissionalId } = req.params;
            const usuarioId = req.user?.id;
            
            if (!usuarioId) {
                ConsultaErrorHandler.handleUnauthorized(res, 'Usuário não autenticado');
                return;
            }

            const { data: consultas, error } = await this.consultaService.listConsultas(
                { profissionalId },
                usuarioId
            );
            
            if (error) {
                throw error;
            }

            ConsultaErrorHandler.sendSuccess(res, consultas);
        } catch (error) {
            ConsultaErrorHandler.handleError(error, res);
        }
    }
}
