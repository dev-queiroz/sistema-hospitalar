import {Router} from 'express';
import {PrescricaoController} from '../controller/PrescricaoController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const prescricaoController = new PrescricaoController();

// Rotas para Prescrições
router.post('/', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), prescricaoController.create.bind(prescricaoController));
router.get('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), prescricaoController.get.bind(prescricaoController));
router.get('/paciente/:pacienteId', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), prescricaoController.listByPaciente.bind(prescricaoController));
router.put('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), prescricaoController.update.bind(prescricaoController));
router.get('/:id/pdf', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), prescricaoController.generatePDF.bind(prescricaoController));

export {router};