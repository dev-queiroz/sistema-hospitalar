import { createClient } from '@supabase/supabase-js';
import { sign, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TOKEN_CONFIG } from '../constants/auth.constants';
import { Database } from '../types/auth.types';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class TokenService {
    private static instance: TokenService;
    private supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    private constructor() {}

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    public async generateTokens(userId: string, role: string) {
        const accessToken = this.generateAccessToken(userId, role);
        const refreshToken = await this.generateRefreshToken(userId);

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60
        };
    }

    public async refreshAccessToken(refreshToken: string) {
        try {
            const { data, error } = await this.supabase
                .from('refresh_tokens')
                .select('user_id, role')
                .eq('token', refreshToken)
                .eq('revoked', false)
                .single();

            if (error || !data) {
                throw new Error('Invalid refresh token');
            }

            return this.generateAccessToken(data.user_id, data.role);
        } catch (error) {
            throw new Error('Failed to refresh token');
        }
    }

    public async revokeRefreshToken(token: string): Promise<void> {
        try {
            await this.supabase
                .from('refresh_tokens')
                .update({ revoked: true })
                .eq('token', token);
        } catch (error) {
            console.error('Failed to revoke refresh token:', error);
        }
    }

    private generateAccessToken(userId: string, role: string): string {
        const payload = {
            sub: userId,
            role,
            type: 'access'
        };

        const options: SignOptions = {
            expiresIn: Number(TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY),
            issuer: 'hospital-auth-service',
            jwtid: uuidv4()
        };

        return sign(payload, JWT_SECRET, options);
    }

    private async generateRefreshToken(userId: string): Promise<string> {
        const refreshToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { error } = await this.supabase
            .from('refresh_tokens')
            .insert([{
                token: refreshToken,
                user_id: userId,
                expires_at: expiresAt.toISOString(),
                revoked: false
            }]);

        if (error) {
            throw new Error('Failed to generate refresh token');
        }

        return refreshToken;
    }
}