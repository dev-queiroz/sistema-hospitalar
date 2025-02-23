import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register/patient', authController.HandlerRegisterPatient);
router.post('/register/professional', authController.HandlerRegisterProfessional);
router.post('/login', authController.HandlerLogin);

export default router;