import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthErrorHandler } from '../utils/error-handler';
import { LoginDTO, RegisterAdminDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../dto/auth.dto';
import {
    AuthenticatedRequest,
    LoginResponse,
    SuccessResponse,
    ErrorResponse, AdminRegistrationResponse
} from '../types/auth.types';
import { AUTH_MESSAGES } from '../constants/auth.constants';
import {TokenService} from "../services/token.service";

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * @route POST /auth/login
     * @desc Autentica um usuário e retorna tokens de acesso
     * @access Public
     */
    public async login(req: Request, res: Response<LoginResponse | ErrorResponse>): Promise<void> {
        try {
            const loginData = LoginDTO.parse(req.body);
            const authResponse = await this.authService.login(loginData);

            res.status(200).json(authResponse);
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * @route POST /auth/register/admin
     * @desc Registra um novo administrador
     */
    public async registerAdmin(
        req: AuthenticatedRequest,
        res: Response<AdminRegistrationResponse | ErrorResponse>
    ): Promise<void> {
        try {
            const adminData = RegisterAdminDTO.parse(req.body);
            const result = await this.authService.registerAdmin(adminData);

            res.status(201).json(result);
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * @route POST /auth/forgot-password
     * @desc Solicita a redefinição de senha
     * @access Public
     */
    public async forgotPassword(
        req: Request,
        res: Response<SuccessResponse | ErrorResponse>
    ): Promise<void> {
        try {
            const { email } = ForgotPasswordDTO.parse(req.body);
            await this.authService.forgotPassword(email);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.PASSWORD_RESET_SENT
            });
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * @route POST /auth/reset-password
     * @desc Envia um email para redefinição de senha
     */
    public async resetPassword(
        req: Request,
        res: Response<SuccessResponse | ErrorResponse>
    ): Promise<void> {
        try {
            const { email } = ResetPasswordDTO.parse(req.body);

            await this.authService.resetPassword(email);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.PASSWORD_RESET_SENT
            });
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * @route POST /auth/refresh-token
     * @desc Atualiza o token de acesso
     */
    public async refreshToken(
        req: Request,
        res: Response<{ access_token: string; expires_in: number } | ErrorResponse>
    ): Promise<void> {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                new Error('Refresh token é obrigatório');
            }

            const tokenService = TokenService.getInstance();
            const accessToken = await tokenService.refreshAccessToken(refresh_token);

            res.status(200).json({
                access_token: accessToken,
                expires_in: 15 * 60
            });
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }

    /**
     * @route POST /auth/logout
     * @desc Realiza o logout do usuário
     * @access Private
     */
    public async logout(
        req: AuthenticatedRequest,
        res: Response<SuccessResponse | ErrorResponse>
    ): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (token) {
                const tokenService = TokenService.getInstance();
                await tokenService.revokeRefreshToken(token);
            }

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.LOGOUT_SUCCESS
            });
        } catch (error) {
            AuthErrorHandler.handleError(error, res);
        }
    }
}

export const authController = new AuthController();