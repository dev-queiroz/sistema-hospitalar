import {Request, Response} from 'express';
import {PrescricaoService} from '../service/PrescricaoService';
import {CreatePrescricaoDTO} from '../../core/dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';
import {supabaseClient} from '../../../shared/database/supabase';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class PrescricaoController {
    private prescricaoService: PrescricaoService;

    constructor() {
        this.prescricaoService = new PrescricaoService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreatePrescricaoDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.createPrescricao(
                validated.pacienteId,
                validated.profissionalId,
                validated.detalhesPrescricao,
                validated.cid10 ?? ''
            );
            res.status(201).json(prescricao);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.getPrescricao(id, usuarioId);
            if (!prescricao) {
                res.status(404).json({error: 'Prescrição não encontrada'});
                return;
            }
            res.json(prescricao);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricoes = await this.prescricaoService.listPrescricoesByPaciente(pacienteId, usuarioId);
            res.json(prescricoes);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = CreatePrescricaoDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.updatePrescricao(
                id,
                validated.detalhesPrescricao,
                validated.cid10,
                usuarioId
            );
            if (!prescricao) {
                res.status(404).json({error: 'Prescrição não encontrada'});
                return;
            }
            res.json(prescricao);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async generatePDF(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prescricao = await this.prescricaoService.getPrescricao(id, usuarioId);
            if (!prescricao) {
                res.status(404).json({error: 'Prescrição não encontrada'});
                return;
            }

            const {data: paciente} = await supabaseClient
                .from('paciente')
                .select('nome, cpf, cns')
                .eq('id', prescricao.pacienteId)
                .single();
            if (!paciente) {
                res.status(400).json({error: 'Paciente não encontrado'});
                return;
            }

            const {data: profissional} = await supabaseClient
                .from('funcionario')
                .select('nome, crm')
                .eq('id', prescricao.profissionalId)
                .single();
            if (!profissional) {
                res.status(400).json({error: 'Profissional não encontrado'});
                return;
            }

            const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=2cm}
\\usepackage{enumitem}
\\usepackage{datetime2}
\\usepackage{noto}

\\begin{document}

\\section*{Prescrição Médica}

\\begin{description}
    \\item[Paciente:] ${paciente.nome}
    \\item[CPF:] ${paciente.cpf}
    \\item[CNS:] ${paciente.cns}
    \\item[Profissional:] ${profissional.nome} (CRM: ${profissional.crm || 'N/A'})
    \\item[Data:] \\today
    \\item[CID-10:] ${prescricao.cid10 || 'Não informado'}
\\end{description}

\\section*{Detalhes da Prescrição}
${prescricao.detalhesPrescricao.replace(/\n/g, '\\\\')}

\\end{document}
            `;

            res.status(200).json({latex: latexContent});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}