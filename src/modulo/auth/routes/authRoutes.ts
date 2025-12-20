import { Router, Request, Response } from 'express';
import { authController } from '../controller/AuthController';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

router.post('/login', (req: Request, res: Response) =>
    authController.login(req as AuthenticatedRequest, res)
);
router.post('/register-admin', (req: Request, res: Response) =>
    authController.registerAdmin(req as AuthenticatedRequest, res)
);
router.post('/forgot-password', (req: Request, res: Response) =>
    authController.forgotPassword(req as AuthenticatedRequest, res)
);
router.post('/reset-password', (req: Request, res: Response) =>
    authController.resetPassword(req as AuthenticatedRequest, res)
);
router.post('/logout', (req: Request, res: Response) =>
    authController.logout(req as AuthenticatedRequest, res)
);
router.post('/refresh-token', (req: Request, res: Response) =>
    authController.refreshToken(req as AuthenticatedRequest, res)
);

export { router };