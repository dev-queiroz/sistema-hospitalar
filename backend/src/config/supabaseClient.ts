import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não estão definidas no .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
