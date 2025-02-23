import { supabase } from '../../../config/supabase';

export const logAction = async (userId: string, acao: string, detalhes: string) => {
    const { data, error } = await supabase
        .from('logs')
        .insert({ user_id: userId, acao, detalhes })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};