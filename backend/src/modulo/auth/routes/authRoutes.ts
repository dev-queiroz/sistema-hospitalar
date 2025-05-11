import {Router} from 'express';
import {AuthController} from '../controller/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register-admin', authController.registerAdmin.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));

export {router};