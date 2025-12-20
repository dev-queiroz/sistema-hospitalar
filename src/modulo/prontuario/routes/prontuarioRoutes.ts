import {Router} from 'express';
import {ProntuarioController} from '../controller/ProntuarioController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';
import rateLimit from 'express-rate-limit';

const router = Router();
const prontuarioController = new ProntuarioController();

router.post('/', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.create.bind(prontuarioController));
router.get('/', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.list.bind(prontuarioController));
router.get('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.get.bind(prontuarioController));
router.get('/pacientes/:pacienteId', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.listByPaciente.bind(prontuarioController));
router.put('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.update.bind(prontuarioController));
router.delete('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.delete.bind(prontuarioController));
router.get('/:id/pdf', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.generatePDF.bind(prontuarioController));

export {router};