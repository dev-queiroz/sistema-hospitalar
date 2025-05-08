import {Router} from 'express';
import {PacienteController} from '../controller/PacienteController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const pacienteController = new PacienteController();

// Rotas para Pacientes
router.post('/', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.create.bind(pacienteController));
router.get('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.get.bind(pacienteController));
router.put('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.update.bind(pacienteController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.delete.bind(pacienteController));
router.get('/', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.list.bind(pacienteController));
router.get('/:id/historico', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.getHistorico.bind(pacienteController));
router.get('/search', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), pacienteController.search.bind(pacienteController));

export {router};