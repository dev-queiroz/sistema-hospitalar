import { createClient } from 'redis';
import { supabase } from '../../../config/supabase';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('Max retries reached');
            }
            return 500;
        },
    },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export const saveOffline = async (table: string, data: any) => {
    try {
        await redisClient.connect();
        await redisClient.lPush(`offline:${table}`, JSON.stringify(data));
        console.log(`Saved offline to ${table}:`, data);
    } catch (error) {
        console.error('Error saving offline:', error);
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
                    await supabase.from(table).insert(parsed).then(
                        () => console.log(`Synchronized ${table}:`, parsed),
                        (err: Error | any) => console.error(`Error syncing ${table}:`, err)
                    );
                }
                await redisClient.del(`offline:${table}`);
            }
        }
    } catch (error) {
        console.error('Error syncing offline:', error);
        throw error;
    } finally {
        await redisClient.disconnect();
    }
};