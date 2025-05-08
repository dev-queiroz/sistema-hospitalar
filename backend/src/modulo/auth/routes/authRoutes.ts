import {Router} from 'express';
import {AuthController} from '../controller/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

export {router};