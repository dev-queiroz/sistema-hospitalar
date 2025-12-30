import { Router } from 'express';
import { IAController } from '../controller/IAController';
import { requireAuth, restrictTo } from '../../../middleware/auth';
import { Papeis } from '../../core/model/Enums';

const router = Router();
const iaController = new IAController();

router.get(
    '/surto',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO),
    iaController.relatorioSurto.bind(iaController)
);

router.get(
    '/paciente/:pacienteId/recorrente',
    requireAuth,
    restrictTo(Papeis.MEDICO),
    iaController.analisarPacienteRecorrente.bind(iaController)
);

router.get(
    '/triagens/:unidadeSaudeId',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO),
    iaController.relatorioTriagens.bind(iaController)
);

router.get(
    '/relatorios',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO, Papeis.ENFERMEIRO),
    iaController.listarRelatorios.bind(iaController)
);

router.get(
    '/relatorios/:relatorioId',
    requireAuth,
    restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.MEDICO, Papeis.ENFERMEIRO),
    iaController.getRelatorioById.bind(iaController)
)

export { router };