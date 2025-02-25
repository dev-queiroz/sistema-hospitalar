import { supabase } from '../../../config/supabase';
import { UnidadeSaude } from '../models/unidadeSaude';

export const createUnidadeSaude = async (unidadeData: UnidadeSaude) => {
    const { data, error } = await supabase
        .from('unidades_saude')
        .insert(unidadeData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getUnidadesSaude = async () => {
    const { data, error } = await supabase
        .from('unidades_saude')
        .select('*');
    if (error) throw new Error(error.message);
    return data;
};

export const updateUnidadeSaude = async (id: string, unidadeData: Partial<UnidadeSaude>) => {
    const { data, error } = await supabase
        .from('unidades_saude')
        .update(unidadeData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteUnidadeSaude = async (id: string) => {
    const { error } = await supabase
        .from('unidades_saude')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Unidade de saúde deletada com sucesso' };
};