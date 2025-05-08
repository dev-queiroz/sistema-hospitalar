import {Router} from 'express';
import {EnfermeiroController} from '../controller/EnfermeiroController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const enfermeiroController = new EnfermeiroController();

// Rotas para Enfermeiros
router.post('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.create.bind(enfermeiroController));
router.get('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.get.bind(enfermeiroController));
router.put('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.update.bind(enfermeiroController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.delete.bind(enfermeiroController));
router.get('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.list.bind(enfermeiroController));

export {router};