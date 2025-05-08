import {Request, Response} from 'express';
import {ProntuarioService} from '../service/ProntuarioService';
import {CreateProntuarioDTO} from '../../core/dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';
import {supabaseClient} from '../../../shared/database/supabase';
import {TriagemService} from '../../triagem/service/TriagemService';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

export class ProntuarioController {
    private prontuarioService: ProntuarioService;
    private triagemService: TriagemService;

    constructor() {
        this.prontuarioService = new ProntuarioService();
        this.triagemService = new TriagemService();
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const validated = CreateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prontuario = await this.prontuarioService.createProntuario(
                validated.pacienteId,
                validated.profissionalId,
                validated.descricao,
                validated.dadosAnonimizados
            );
            res.status(201).json(prontuario);
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
            const prontuario = await this.prontuarioService.getProntuario(id, usuarioId);
            if (!prontuario) {
                res.status(404).json({error: 'Prontuário não encontrado'});
                return;
            }
            res.json(prontuario);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prontuarios = await this.prontuarioService.listProntuariosByPaciente(pacienteId, usuarioId);
            res.json(prontuarios);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const validated = CreateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');
            const prontuario = await this.prontuarioService.updateProntuario(
                id,
                validated.descricao,
                validated.dadosAnonimizados,
                usuarioId
            );
            if (!prontuario) {
                res.status(404).json({error: 'Prontuário não encontrado'});
                return;
            }
            res.json(prontuario);
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
            const prontuario = await this.prontuarioService.getProntuario(id, usuarioId);
            if (!prontuario) {
                res.status(404).json({error: 'Prontuário não encontrado'});
                return;
            }

            const {data: paciente} = await supabaseClient
                .from('paciente')
                .select('nome, cpf, cns')
                .eq('id', prontuario.pacienteId)
                .single();
            if (!paciente) {
                res.status(400).json({error: 'Paciente não encontrado'});
                return;
            }

            const {data: profissional} = await supabaseClient
                .from('funcionario')
                .select('nome, crm, papel')
                .eq('id', prontuario.profissionalId)
                .single();
            if (!profissional) {
                res.status(400).json({error: 'Profissional não encontrado'});
                return;
            }

            const triagens = await this.triagemService.listTriagensByPaciente(prontuario.pacienteId, usuarioId);
            const triagemContent = triagens.length > 0
                ? triagens
                    .map(
                        (t) =>
                            `\\item[${new Date(t.createdAt).toLocaleDateString('pt-BR')}]: ${
                                t.queixaPrincipal
                            } (Gravidade: ${t.nivelGravidade})`
                    )
                    .join('')
                : 'Nenhuma triagem registrada.';

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

\\section*{Prontuário Médico}

\\begin{description}
    \\item[Paciente:] ${paciente.nome}
    \\item[CPF:] ${paciente.cpf}
    \\item[CNS:] ${paciente.cns}
    \\item[Profissional:] ${profissional.nome} (${
                profissional.papel === Papeis.MEDICO ? 'CRM: ' + (profissional.crm || 'N/A') : 'Enfermeiro'
            })
    \\item[Data:] \\today
\\end{description}

\\section*{Descrição}
${prontuario.descricao.replace(/\n/g, '\\\\')}

\\section*{Triagens Associadas}
\\begin{itemize}
${triagemContent}
\\end{itemize}

\\end{document}
            `;

            res.status(200).json({latex: latexContent});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}