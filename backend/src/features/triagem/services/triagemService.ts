import { supabase } from '../../../config/supabase';
import { Triagem } from '../models/triagem';

export const realizarTriagem = async (triagemData: Triagem) => {
    const { data, error } = await supabase
        .from('triagens')
        .insert(triagemData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};