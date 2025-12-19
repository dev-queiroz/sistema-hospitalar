import { Router } from 'express';
import { IAController } from '../controller/IAController';
import { requireAuth, restrictTo } from '../../../middleware/auth';
import { Papeis } from '../../core/model/Enums';

const router = Router();
const iaController = new IAController();

// Relatório de surto respiratório - acesso para ADMIN e MÉDICO
router.get(
    '/surto',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO),
    iaController.relatorioSurto.bind(iaController)
);

// Análise de paciente recorrente - apenas MÉDICO
router.get(
    '/paciente/:pacienteId/recorrente',
    requireAuth,
    restrictTo(Papeis.MEDICO),
    iaController.analisarPacienteRecorrente.bind(iaController)
);

// Relatório de triagens por unidade - ADMIN e MÉDICO
router.get(
    '/triagens/:unidadeSaudeId',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO),
    iaController.relatorioTriagens.bind(iaController)
);

// Listar relatórios recentes - todos os profissionais autenticados
router.get(
    '/relatorios',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO, Papeis.ENFERMEIRO),
    iaController.listarRelatorios.bind(iaController)
);

export { router };