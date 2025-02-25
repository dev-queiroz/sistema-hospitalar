import { supabase } from '../../../config/supabase';

export const allocateProfessional = async (professionalId: string, unidadeSaudeId: string) => {
    const { data, error } = await supabase
        .from('professionals')
        .update({ unidade_saude_id: unidadeSaudeId })
        .eq('id', professionalId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};