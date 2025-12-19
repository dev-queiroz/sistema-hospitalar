import { Router, Request, Response } from 'express';
import { AuthController } from '../controller/AuthController';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const authController = new AuthController();

// Type the request and response objects explicitly
router.post('/login', (req: Request, res: Response) =>
    authController.login(req as AuthenticatedRequest, res)
);
router.post('/register-admin', (req: Request, res: Response) =>
    authController.registerAdmin(req as AuthenticatedRequest, res)
);
router.post('/forgot-password', (req: Request, res: Response) =>
    authController.forgotPassword(req as AuthenticatedRequest, res)
);

export { router };