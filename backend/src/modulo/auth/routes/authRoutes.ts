import {Router} from 'express';
import {AuthController} from '../controller/AuthController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/register-admin', authController.registerAdmin.bind(authController));
router.post('/deactivate/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), authController.deactivate.bind(authController));

export {router};