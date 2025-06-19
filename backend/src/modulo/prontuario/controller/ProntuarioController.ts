import {Request, Response} from 'express';
import {ProntuarioService} from '../service/ProntuarioService';
import {PacienteService} from '../../paciente/service/PacienteService';
import {TriagemService} from '../../triagem/service/TriagemService';
import {CreateProntuarioDTO, UpdateProntuarioDTO} from '../../core/dtos';
import {z} from 'zod';
import {Papeis} from '../../core/model/Enums';
import {supabaseClient} from '../../../shared/database/supabase';

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
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

            const {data, error} = await this.prontuarioService.createProntuario(
                validated.pacienteId,
                usuarioId,
                validated.unidadeSaudeId,
                validated.descricao,
                validated.dadosAnonimizados
            );

            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao criar prontuário'});
                return;
            }
            res.status(201).json(data);
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

            const {data, error} = await this.prontuarioService.getProntuario(id, usuarioId);
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Prontuário não encontrado'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    async listByPaciente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const pacienteId = req.params.pacienteId;
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prontuarioService.listProntuariosByPaciente(pacienteId, usuarioId);
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
            const validated = UpdateProntuarioDTO.parse(req.body);
            const usuarioId = req.user?.id;
            if (!usuarioId) throw new Error('ID do usuário não encontrado');

            const {data, error} = await this.prontuarioService.updateProntuario(
                id,
                validated.descricao,
                validated.dadosAnonimizados,
                usuarioId
            );
            if (error || !data) {
                res.status(404).json({error: error?.message || 'Prontuário não encontrado'});
                return;
            }
            res.json(data);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({errors: error.errors});
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

            const {data, error} = await this.prontuarioService.deleteProntuario(id, usuarioId);
            if (error || !data) {
                res.status(400).json({error: error?.message || 'Erro ao desativar prontuário'});
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
                data: prontuario,
                error: prontuarioError
            } = await this.prontuarioService.getProntuario(id, usuarioId);
            if (prontuarioError || !prontuario) {
                res.status(404).json({error: prontuarioError?.message || 'Prontuário não encontrado'});
                return;
            }

            const {
                data: paciente,
                error: pacienteError
            } = await this.pacienteService.getPaciente(prontuario.pacienteId, usuarioId);
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
            if (profissionalError || !profissional) {
                res.status(400).json({error: profissionalError?.message || 'Profissional não encontrado'});
                return;
            }

            const {data: unidade, error: unidadeError} = await supabaseClient
                .from('unidade_saude')
                .select('nome, telefone')
                .eq('id', prontuario.unidadeSaudeId)
                .single();
            if (unidadeError || !unidade) {
                res.status(400).json({error: unidadeError?.message || 'Unidade de saúde não encontrada'});
                return;
            }

            const {
                data: triagens,
                error: triagemError
            } = await this.triagemService.listTriagensByPaciente(prontuario.pacienteId);
            if (triagemError) {
                res.status(400).json({error: triagemError.message});
                return;
            }

            // Escapar caracteres especiais para LaTeX
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

            const triagemContent = triagens.length > 0
                ? triagens
                    .map((t) =>
                        `\\item[${new Date(t.createdAt).toLocaleDateString('pt-BR')}]: ${escapeLatex(t.queixaPrincipal)} (Gravidade: ${t.nivelGravidade})`
                    )
                    .join('')
                : 'Nenhuma triagem registrada.';

            const timelineContent = triagens.length > 0
                ? triagens
                    .map((t) => `\\event{${new Date(t.createdAt).toLocaleDateString('pt-BR')}}{Triagem: ${escapeLatex(t.queixaPrincipal)}}`)
                    .join('\n')
                : '';

            const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=2cm}
\\usepackage{enumitem}
\\usepackage{datetime2}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{xcolor}
\\usepackage{titling}
\\usepackage{tikz}
\\usepackage{hyperref}

\\definecolor{headerblue}{RGB}{0, 51, 102}
\\definecolor{lightgray}{RGB}{240, 240, 240}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\includegraphics[width=3cm]{logo.png}}
\\rhead{\\textbf{Prontuário Médico} \\\\ \\today}
\\lfoot{Confidencial - Uso exclusivo do sistema hospitalar}
\\rfoot{Página \\thepage}

\\pretitle{\\begin{center}\\LARGE\\color{headerblue}\\textbf}
\\posttitle{\\end{center}}
\\title{Prontuário Médico}
\\author{}
\\date{}

\\begin{document}

\\maketitle
\\vspace{-1cm}
\\hrule height 1pt
\\vspace{0.5cm}

\\section*{Informações Gerais}
\\begin{longtable}{@{}p{5cm}p{10cm}@{}}
  \\toprule
  \\textbf{Campo} & \\textbf{Detalhes} \\\\
  \\midrule
  Paciente & ${escapeLatex(paciente.nome)} \\\\
  CPF & ${escapeLatex(paciente.cpf)} \\\\
  CNS & ${escapeLatex(paciente.cns)} \\\\
  Data de Nascimento & ${escapeLatex(new Date(paciente.dataNascimento).toLocaleDateString('pt-BR'))} \\\\
  Profissional & ${escapeLatex(profissional.nome)} (${profissional.papel === Papeis.MEDICO ? `Médico, CRM: ${escapeLatex(profissional.crm || 'N/A')}` : 'Enfermeiro'}) \\\\
  Unidade de Saúde & ${escapeLatex(unidade.nome)} \\\\
  Data do Registro & ${new Date().toLocaleDateString('pt-BR')} \\\\
  \\bottomrule
\\end{longtable}

\\section*{Descrição do Prontuário}
\\color{black}
${escapeLatex(prontuario.descricao)} \\par
\\vspace{0.5cm}

\\section*{Triagens Associadas}
\\begin{itemize}[leftmargin=*,labelsep=5mm]
${triagens.length > 0
                ? triagens
                    .map((t) =>
                        `\\item [${new Date(t.createdAt).toLocaleDateString('pt-BR')}]: ${escapeLatex(t.queixaPrincipal)} (Gravidade: ${t.nivelGravidade})`
                    )
                    .join('\n')
                : '\\item Nenhuma triagem registrada.'}
\\end{itemize}

\\section*{Linha do Tempo de Atendimentos}
\\begin{center}
\\begin{tikzpicture}
\\draw[->] (0,0) -- (${triagens.length + 1}.5,0) node[right] {Tempo};
${triagens
                .map(
                    (t, i) =>
                        `\\node[below] at (${i + 1},0) {\\small ${escapeLatex(
                            new Date(t.createdAt).toLocaleDateString('pt-BR')
                        )}};`
                )
                .join('\n')}
\\node[below] at (${triagens.length + 1},0) {\\small ${new Date().toLocaleDateString('pt-BR')}};
\\end{tikzpicture}
\\end{center}

\\section*{Notas Adicionais}
\\begin{itemize}
  \\item Este documento é confidencial e deve ser acessado apenas por profissionais autorizados.
  \\item Para mais informações, contate a unidade de saúde em ${escapeLatex(unidade.telefone || '(11) 99999-9999')}.
\\end{itemize}

\\clearpage
\\begin{center}
  \\small
  \\color{gray}
  Documento gerado pelo Sistema Hospitalar em ${new Date().toLocaleDateString('pt-BR')}. \\\\
  \\href{https://sistema-hospitalar.onrender.com}{sistema-hospitalar.onrender.com}
\\end{center}

\\end{document}
`;

            res.status(200).json({latex: latexContent});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }
}