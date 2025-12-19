import { Response } from 'express';
import { ZodError } from 'zod';

export class AuthErrorHandler {
    static handleError(error: unknown, res: Response): void {
        console.error('Auth Error:', error);

        if (error instanceof ZodError) {
            const errors: Record<string, string[]> = {};
            error.issues.forEach(issue => {
                const path = issue.path.join('.');
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(issue.message);
            });

            res.status(400).json({ error: 'Validation error', errors });
            return;
        }

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ error: errorMessage });
    }

    static handleAuthError(res: Response, message: string, statusCode: number = 401): void {
        res.status(statusCode).json({ error: message });
    }
}
