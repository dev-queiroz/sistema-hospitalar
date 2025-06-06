import {createClient} from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL e SUPABASE_KEY devem ser definidos no .env');
}

// Cria o cliente Supabase
export const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Cria o cliente Supabase com service_role key (ignora RLS)
export const supabaseServiceClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);