import { createClient } from 'redis';
import { supabase } from '../../../config/supabase';
import { Request, Response, NextFunction } from 'express';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: { reconnectStrategy: (retries) => (retries > 10 ? new Error('Max retries') : 500) },
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

export const saveOffline = async (table: string, data: any) => {
    try {
        await redisClient.connect();
        await redisClient.lPush(`offline:${table}`, JSON.stringify(data));
    } catch (error) {
        console.error('Erro ao salvar offline:', error);
        throw error;
    } finally {
        await redisClient.disconnect();
    }
};

export const syncOffline = async () => {
    try {
        await redisClient.connect();
        const tables = ['patients', 'prontuarios', 'triagens', 'agendamentos', 'prescricoes', 'encaminhamentos'];
        for (const table of tables) {
            const data = await redisClient.lRange(`offline:${table}`, 0, -1);
            if (data.length > 0) {
                for (const item of data) {
                    const parsed = JSON.parse(item);
                    await supabase.from(table).insert(parsed);
                }
                await redisClient.del(`offline:${table}`);
            }
        }
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
        throw error;
    } finally {
        await redisClient.disconnect();
    }
};

// Middleware para tentar online primeiro, offline em falha
export const offlineMiddleware = (table: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await supabase.from(table).select('id').limit(1); // Testa conexão
        next();
    } catch (error) {
        await saveOffline(table, req.body);
        res.status(202).json({ message: 'Salvo offline, será sincronizado ao reconectar' });
    }
};