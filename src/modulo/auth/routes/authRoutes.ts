// src/routes/auth.routes.ts
import { Router } from 'express';
import { authController } from '../controller/AuthController';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/register-admin', authController.registerAdmin.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.get('/me', authController.me.bind(authController));

export { router };