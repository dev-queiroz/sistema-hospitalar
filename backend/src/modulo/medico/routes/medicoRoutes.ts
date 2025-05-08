import {Router} from 'express';
import {MedicoController} from '../controller/MedicoController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const medicoController = new MedicoController();

// Rotas para Médicos
router.post('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), medicoController.create.bind(medicoController));
router.get('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), medicoController.get.bind(medicoController));
router.put('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), medicoController.update.bind(medicoController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), medicoController.delete.bind(medicoController));
router.get('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), medicoController.list.bind(medicoController));

export {router};