import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthErrorHandler } from '../utils/error-handler';
import { LoginDTO, RegisterAdminDTO, ForgotPasswordDTO } from '../dto/auth.dto';
import { AuthenticatedRequest, LoginResponse } from '../types/auth.types';

/**
 * Controller for handling authentication related requests
 */
export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Handle user login
     * @param req Express request containing email and password
     * @param res Express response
     */
    async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const loginData = LoginDTO.parse(req.body);
            const { user, session } = await this.authService.login(loginData);

            // Get user role from the database
            const { data: usuario } = await this.authService.getUserRole(user.id);

            if (!usuario) {
                AuthErrorHandler.handleAuthError(res, 'Usuário não encontrado ou inativo');
                return;
            }

            const response: LoginResponse = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                papel: usuario.papel,
                expires_in: session.expires_in,
            };

            res.status(200).json(response);
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * Handle admin registration
     * @param req Express request containing admin registration data
     * @param res Express response
     */
    async registerAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const adminData = RegisterAdminDTO.parse(req.body);
            const result = await this.authService.registerAdmin(adminData);
            res.status(201).json(result);
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * Handle password reset request
     * @param req Express request containing user email
     * @param res Express response
     */
    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = ForgotPasswordDTO.parse(req.body);
            
            // Check if user exists and is active
            const { data: usuario } = await this.authService.checkUserExists(email);
            
            if (!usuario) {
                // Return success even if user doesn't exist to prevent email enumeration
                res.status(200).json({ message: 'Se o email existir, você receberá um link de recuperação' });
                return;
            }

            await this.authService.forgotPassword(email);
            res.status(200).json({ message: 'Se o email existir, você receberá um link de recuperação' });
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }
}