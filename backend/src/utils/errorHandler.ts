import { Response } from 'express';

export const handleError = (res: Response, status: number, message: string) => {
    res.status(status).json({ error: message });
};