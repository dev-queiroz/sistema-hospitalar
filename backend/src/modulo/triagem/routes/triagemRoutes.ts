import {Router} from 'express';
import {TriagemController} from '../controller/TriagemController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const triagemController = new TriagemController();

// Rotas para Triagens
router.post('/', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.create.bind(triagemController));
router.get('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.get.bind(triagemController));
router.get('/paciente/:pacienteId', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.listByPaciente.bind(triagemController));
router.get('/gravidade/:nivelGravidade/unidade/:unidadeSaudeId', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.listByGravidade.bind(triagemController));
router.put('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.update.bind(triagemController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ENFERMEIRO, Papeis.ADMINISTRADOR_PRINCIPAL), triagemController.delete.bind(triagemController));

export {router};