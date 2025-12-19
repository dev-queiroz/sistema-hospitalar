import { Response } from 'express';
import { ZodError } from 'zod';

export class ConsultaErrorHandler {
    /**
     * Handle errors consistently across the consulta module
     * @param error The error that occurred
     * @param res Express response object
     */
    static handleError(error: unknown, res: Response): void {
        console.error('Consulta Error:', error);

        if (error instanceof ZodError) {
            const errors: Record<string, string[]> = {};
            error.issues.forEach(issue => {
                const path = issue.path.join('.');
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(issue.message);
            });

            res.status(400).json({ 
                success: false,
                error: 'Validation error',
                details: errors 
            });
            return;
        }

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ 
            success: false,
            error: errorMessage 
        });
    }

    /**
     * Handle not found errors
     */
    static handleNotFound(res: Response, message: string = 'Resource not found'): void {
        res.status(404).json({ 
            success: false,
            error: message 
        });
    }

    /**
     * Handle unauthorized access
     */
    static handleUnauthorized(res: Response, message: string = 'Unauthorized access'): void {
        res.status(403).json({ 
            success: false,
            error: message 
        });
    }

    /**
     * Standard success response
     */
    static sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
        res.status(statusCode).json({ 
            success: true,
            data 
        });
    }
}
