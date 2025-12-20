import { Response } from 'express';
import { ZodError } from 'zod';
import { AUTH_ERRORS } from '../constants/auth.constants';

export class AuthErrorHandler {
    public static handleError(error: unknown, res: Response): void {
        console.error('Auth Error:', error);

        if (error instanceof ZodError) {
            this.handleValidationError(error, res);
        } else if (error instanceof Error) {
            this.handleCustomError(error, res);
        } else {
            this.handleUnexpectedError(res);
        }
    }

    private static handleValidationError(error: ZodError, res: Response): void {
        const formattedErrors = error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));

        res.status(400).json({
            error: 'Erro de validação',
            errors: formattedErrors
        });
    }

    private static handleCustomError(error: Error, res: Response): void {
        const errorMessage = error.message;
        let statusCode = 400;

        switch (errorMessage) {
            case AUTH_ERRORS.INVALID_CREDENTIALS:
            case AUTH_ERRORS.INVALID_TOKEN:
                statusCode = 401;
                break;
            case AUTH_ERRORS.USER_NOT_FOUND:
                statusCode = 404;
                break;
            case AUTH_ERRORS.ADMIN_EXISTS:
            case AUTH_ERRORS.DUPLICATE_USER:
            case AUTH_ERRORS.EMAIL_ALREADY_EXISTS:
            case AUTH_ERRORS.CPF_ALREADY_EXISTS:
            case AUTH_ERRORS.CNS_ALREADY_EXISTS:
                statusCode = 409;
                break;
            case AUTH_ERRORS.USER_CREATION_FAILED:
            case AUTH_ERRORS.ADMIN_CREATION_FAILED:
            case AUTH_ERRORS.PASSWORD_RESET_FAILED:
                statusCode = 500;
                break;
        }

        res.status(statusCode).json({
            error: errorMessage,
            code: errorMessage.replace(/\s+/g, '_').toUpperCase()
        });
    }

    private static handleUnexpectedError(res: Response): void {
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
}