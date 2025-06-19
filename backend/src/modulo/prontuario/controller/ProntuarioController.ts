import {Request, Response} from 'express';
import {ProntuarioService} from '../service/ProntuarioService';
import {PacienteService} from '../../paciente/service/PacienteService';
import {TriagemService} from '../../triagem/service/TriagemService';
import {CreateProntuarioDTO, UpdateProntuarioDTO} from '../../core/dtos';
import {z} from 'zod';
import {supabaseClient} from '../../../shared/database/supabase';
import {compileToPDF} from '../../../utils/pdfCompiler';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'}),
        new winston.transports.Console({format: winston.format.simple()}),
    ],
});

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: string };
}

export class ProntuarioController {
    private prontuarioService: ProntuarioService;
    private pacienteService: PacienteService;
    private triagemService: TriagemService;

    constructor() {
        this.prontuarioService = new ProntuarioService();
        this.pacienteService = new PacienteService();
        this.triagemService = new TriagemService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info('Creating prontuário', {usuarioId, pacienteId: validated.pacienteId});
            const {data, error} = await this.prontuarioService.createProntuario(
                validated.pacienteId,
                usuarioId,
                validated.unidadeSaudeId,
                validated.descricao,
                validated.dadosAnonimizados
            );

            if (error || !data) {
                logger.error('Failed to create prontuário', {error: error?.message});
                res.status(400).json({error: error?.message || 'Erro ao criar prontuário'});
                return;
            }
            res.status(201).json(data);
        } catch (error: any) {
            logger.error('Error in create', {error: error?.message});
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error?.errors});
            } else {
                res.status(400).json({error: error?.message});
            }
        }
    }

    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info('Listing prontuários', {usuarioId});
            const {data, error} = await this.prontuarioService.getAllProntuarios(usuarioId);
            if (error) {
                logger.error('Failed to list prontuários', {error: error?.message});
                res.status(400).json({error: error?.message});
                return;
            }
            res.json(data);
        } catch (err: any) {
            logger.error('Error in list', {error: err.message});
            res.status(400).json({error: err.message});
        }
    }

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info('Getting prontuário', {id, usuarioId});
            const {data, error} = await this.prontuarioService.getProntuario(id, usuarioId);
            if (error || !data) {
                logger.error('Prontuário not found', {id, error: error?.message});
                res.status(404).json({error: error?.message || 'Prontuário não encontrado'});
                return;
            }
            res.json(data);
        } catch (err: any) {
            logger.error('Error in get', {error: err.message});
            res.status(400).json({error: err.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info('Listing prontuários por paciente', {pacienteId, usuarioId});
            const {data, error} = await this.prontuarioService.listProntuariosByPaciente(pacienteId, usuarioId);
            if (error) {
                logger.error('Failed to list prontuários por paciente', {error: error?.message});
                res.status(400).json({error: error?.message});
                return;
            }
            res.json(data);
        } catch (err: any) {
            logger.error('Error in listByPaciente', {error: err.message});
            res.status(400).json({error: err.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info('Updating prontuário', {id, usuarioId});
            const {data, error} = await this.prontuarioService.updateProntuario(
                id,
                validated.descricao,
                validated.dadosAnonimizados,
                usuarioId
            );
            if (error || !data) {
                logger.error('Prontuário not found for update', {id, error: error?.message});
                res.status(404).json({error: error?.message || 'Prontuário não encontrado'});
                return;
            }
            res.json(data);
        } catch (err: any) {
            logger.error('Error in update', {error: err.message});
            if (err instanceof z.ZodError) {
                res.status(400).json({errors: err.errors});
            } else {
                res.status(400).json({error: err.message});
            }
        }
    }

    async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('Usuário não encontrado');

            logger.info('Deleting prontuário', {id, usuarioId});
            const {data, error} = await this.prontuarioService.deleteProntuario(id, usuarioId);
            if (error || !data) {
                logger.error('Failed to delete prontuário', {id, error: error?.message});
                res.status(400).json({error: error?.message || 'Erro ao desativar prontuário'});
                return;
            }
            res.status(204).send();
        } catch (err: any) {
            logger.error('Error in delete', {error: err.message});
            res.status(400).json({error: err.message});
        }
    }

    async generatePDF(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            logger.info(`Generating PDF for prontuário ${id} by user ${usuarioId}`);

            const {
                data: prontuario,
                error: prontuarioError
            } = await this.prontuarioService.getProntuario(id, usuarioId);
            logger.info('Prontuário', {found: !!prontuario, error: prontuarioError?.message});
            if (prontuarioError || !prontuario) {
                res.status(404).json({error: prontuarioError?.message || 'Prontuário não encontrado'});
                return;
            }

            const {
                data: paciente,
                error: pacienteError
            } = await this.pacienteService.getPaciente(prontuario.pacienteId, usuarioId);
            logger.info('Paciente', {found: !!paciente, error: pacienteError?.message});
            if (pacienteError || !paciente) {
                res.status(400).json({error: pacienteError?.message || 'Paciente não encontrado'});
                return;
            }

            const {data: profissional, error: profissionalError} = await supabaseClient
                .from('funcionario')
                .select('nome, papel, crm')
                .eq('id', prontuario.profissionalId)
                .eq('ativo', true)
                .single();
            logger.info('Profissional', {found: !!profissional, error: profissionalError?.message});
            if (profissionalError || !profissional) {
                res.status(400).json({error: profissionalError?.message || 'Profissional não encontrado'});
                return;
            }

            const {data: unidade, error: unidadeError} = await supabaseClient
                .from('unidade_saude')
                .select('nome, telefone')
                .eq('id', prontuario.unidadeSaudeId)
                .single();
            logger.info('Unidade', {found: !!unidade, error: unidadeError?.message});
            if (unidadeError || !unidade) {
                res.status(400).json({error: unidadeError?.message || 'Unidade de saúde não encontrada'});
                return;
            }

            const {
                data: triagens,
                error: triagemError
            } = await this.triagemService.listTriagensByPaciente(prontuario.pacienteId);
            logger.info('Triagens', {count: triagens?.length || 0, error: triagemError?.message});
            if (triagemError) {
                res.status(400).json({error: triagemError.message});
                return;
            }

            const pdfBuffer = await compileToPDF({
                paciente: {
                    nome: paciente.nome,
                    cpf: paciente.cpf,
                    cns: paciente.cns,
                    dataNascimento: paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : '',
                },
                profissional: {
                    nome: profissional.nome,
                    papel: profissional.papel,
                    crm: profissional.crm,
                },
                unidade: {
                    nome: unidade.nome,
                    telefone: unidade.telefone || '(11) 99999-9999',
                },
                prontuario: {
                    descricao: prontuario.descricao,
                },
                triagens: triagens?.map(t => ({
                    createdAt: t.createdAt.toISOString(),
                    queixaPrincipal: t.queixaPrincipal || '',
                    nivelGravidade: t.nivelGravidade || ''
                })) || [],
            });
            logger.info('PDF compiled successfully with pdfkit', {size: pdfBuffer.length});

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=prontuario_${id}.pdf`);
            res.send(pdfBuffer);
        } catch (err: any) {
            logger.error('Error generating PDF', {message: err.message});
            res.status(500).json({error: `Erro ao gerar o PDF: ${err.message}`});
        }
    }
}