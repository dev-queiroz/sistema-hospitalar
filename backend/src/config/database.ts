import {createClient, SupabaseClient} from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);