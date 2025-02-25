import { supabase } from '../../../config/supabase';
import { Triagem } from '../models/triagem';

const order: Record<'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul', number> = {
    vermelho: 5,
    laranja: 4,
    amarelo: 3,
    verde: 2,
    azul: 1,
};

export const realizarTriagem = async (triagemData: Triagem) => {
    const { data, error } = await supabase
        .from('triagens')
        .insert(triagemData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getQueue = async () => {
    const { data, error } = await supabase
        .from('triagens')
        .select('id, patient_id, classificacao_risco, data_hora, patients(nome)')
        .order('classificacao_risco', { ascending: false })
        .order('data_hora', { ascending: true });
    if (error) throw new Error(error.message);
    return data.sort((a, b) => {
        const aPriority = order[a.classificacao_risco as keyof typeof order];
        const bPriority = order[b.classificacao_risco as keyof typeof order];
        return bPriority - aPriority || new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
    });
};