import {Request, Response} from 'express';
import {PrescricaoService} from '../service/PrescricaoService';
import {CreatePrescricaoDTO, UpdatePrescricaoDTO} from '../../core/dtos';
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

            const {data, error} = await this.prescricaoService.createPrescricao(
                validated.pacienteId,
                usuarioId,
                validated.unidadeSaudeId,
                validated.detalhesPrescricao,
                validated.cid10
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar prescrição'});
                return;
            }
            res.status(201).json(data);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.message});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prescricaoService.getAllPrescricoes(usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async get(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prescricaoService.getPrescricao(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Prescrição não encontrada'});
                return;
            }
            res.json(data);
        } catch
            (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prescricaoService.listPrescricoesByPaciente(pacienteId, usuarioId);
            if (error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = UpdatePrescricaoDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {
                data,
                error
            } = await this.prescricaoService.updatePrescricao(id, validated.detalhesPrescricao, validated.cid10, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Prescrição não encontrada'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.message});
            } else {
                res.status(400).json({error: error.message});
            }
        }
    }

    async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prescricaoService.deletePrescricao(id, usuarioId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar prescrição'});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async generatePDF(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {
                data: prescricao,
                error: prescricaoError
            } = await this.prescricaoService.getPrescricao(id, usuarioId);
            if (prescricaoError || !prescricao) {
                res.status(404).json({error: prescricaoError?.message || 'Prescrição não encontrada'});
                return;
            }

            const {data: paciente, error: pacienteError} = await supabaseClient
                .from('paciente')
                .select('nome, cpf, cns')
                .eq('id', prescricao.pacienteId)
                .eq('ativo', true)
                .single();
            if (pacienteError || !paciente) {
                res.status(400).json({error: pacienteError?.message || 'Paciente não encontrado'});
                return;
            }

            const {data: profissional, error: profissionalError} = await supabaseClient
                .from('funcionario')
                .select('nome, papel, crm')
                .eq('id', prescricao.profissionalId)
                .eq('ativo', true)
                .single();
            if (profissionalError || !profissional) {
                res.status(400).json({error: profissionalError?.message || 'Profissional não encontrado'});
                return;
            }

            const {data: unidade, error: unidadeError} = await supabaseClient
                .from('unidade_saude')
                .select('nome')
                .eq('id', prescricao.unidadeSaudeId)
                .single();
            if (unidadeError || !unidade) {
                res.status(400).json({error: unidadeError?.message || 'Unidade de saúde não encontrada'});
                return;
            }

            const escapeLatex = (str: string) => {
                const replacements: { [key: string]: string } = {
                    '&': '\\&',
                    '%': '\\%',
                    '$': '\\$',
                    '#': '\\#',
                    '_': '\\_',
                    '{': '\\{',
                    '}': '\\}',
                    '~': '\\textasciitilde{}',
                    '^': '\\textasciicircum{}',
                    '\\': '\\textbackslash{}',
                };
                return str.replace(/[&%$#_{}~^\\]/g, (match) => replacements[match]);
            };

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
    \\item[Paciente:] ${escapeLatex(paciente.nome)}
    \\item[CPF:] ${paciente.cpf}
    \\item[CNS:] ${paciente.cns}
    \\item[Profissional:] ${escapeLatex(profissional.nome)} (${
                profissional.papel === Papeis.MEDICO ? 'CRM: ' + (profissional.crm || 'N/A') : 'Enfermeiro'
            })
    \\item[Unidade de Saúde:] ${escapeLatex(unidade.nome)}
    \\item[Data:] \\today
    \\item[CID-10:] ${escapeLatex(prescricao.cid10)}
\\end{description}

\\section*{Detalhes da Prescrição}
${escapeLatex(prescricao.detalhesPrescricao).replace(/\n/g, '\\\\')}

\\end{document}
      `;

            res.status(200).json({latex: latexContent});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}