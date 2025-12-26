import { Request, Response } from 'express';
import { GroqService } from '../service/GroqService';
import { Papeis } from '../../core/model/Enums';
import {supabaseServiceClient} from "@/shared/database/supabase";

interface AuthenticatedRequest extends Request {
    user?: { id: string; papel: Papeis };
}

const groqService = new GroqService();

export class IAController {
    async relatorioSurto(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const unidadeSaudeId = req.query.unidade_saude_id as string | undefined;

            const relatorio = await groqService.gerarRelatorioSurto(unidadeSaudeId);

            res.status(200).json({
                sucesso: true,
                relatorio,
                unidade_saude_id: unidadeSaudeId || null,
                gerado_em: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                erro: 'Falha ao gerar relatório de surto',
                mensagem: error.message
            });
        }
    }

    async analisarPacienteRecorrente(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { pacienteId } = req.params;
            const profissionalId = req.user?.id;

            if (!profissionalId) {
                res.status(401).json({ erro: 'Usuário não autenticado' });
                return;
            }

            if (!pacienteId) {
                res.status(400).json({ erro: 'ID do paciente é obrigatório' });
                return;
            }

            const analise = await groqService.analisarPacienteRecorrente(pacienteId, profissionalId);

            res.status(200).json({
                sucesso: true,
                analise,
                paciente_id: pacienteId,
                gerado_em: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                erro: 'Falha ao analisar paciente recorrente',
                mensagem: error.message
            });
        }
    }

    async relatorioTriagens(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { unidadeSaudeId } = req.params;

            if (!unidadeSaudeId) {
                res.status(400).json({ erro: 'ID da unidade de saúde é obrigatório' });
                return;
            }

            const relatorio = await groqService.gerarRelatorioTriagens(unidadeSaudeId);

            res.status(200).json({
                sucesso: true,
                relatorio,
                unidade_saude_id: unidadeSaudeId,
                gerado_em: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                erro: 'Falha ao gerar relatório de triagens',
                mensagem: error.message
            });
        }
    }

    async listarRelatorios(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            const { data, error } = await supabaseServiceClient
                .from('relatorios_ia')
                .select('id, tipo, conteudo, unidade_saude_id, criado_em')
                .order('criado_em', { ascending: false })
                .limit(limit);

            if (error) new Error(error.message);

            res.status(200).json({
                sucesso: true,
                relatorios: data
            });
        } catch (error: any) {
            res.status(500).json({
                erro: 'Falha ao listar relatórios',
                mensagem: error.message
            });
        }
    }
}