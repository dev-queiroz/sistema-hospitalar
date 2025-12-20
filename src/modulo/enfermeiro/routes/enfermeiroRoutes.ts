import {Router} from 'express';
import {EnfermeiroController} from '../controller/EnfermeiroController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const enfermeiroController = new EnfermeiroController();

router.post('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.create.bind(enfermeiroController));
router.get('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.ENFERMEIRO), enfermeiroController.get.bind(enfermeiroController));
router.put('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.update.bind(enfermeiroController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), enfermeiroController.delete.bind(enfermeiroController));
router.get('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL, Papeis.ENFERMEIRO), enfermeiroController.list.bind(enfermeiroController));

export {router};