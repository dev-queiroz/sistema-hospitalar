import {createClient} from 'redis';

export const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch((err) => console.error('Redis Client Error', err));