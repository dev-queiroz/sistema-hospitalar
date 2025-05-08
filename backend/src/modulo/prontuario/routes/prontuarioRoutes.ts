import {Router} from 'express';
import {ProntuarioController} from '../controller/ProntuarioController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const prontuarioController = new ProntuarioController();

// Rotas para Prontuários
router.post('/', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.create.bind(prontuarioController));
router.get('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.get.bind(prontuarioController));
router.get('/paciente/:pacienteId', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.listByPaciente.bind(prontuarioController));
router.put('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.update.bind(prontuarioController));
router.get('/:id/pdf', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), prontuarioController.generatePDF.bind(prontuarioController));

export {router};