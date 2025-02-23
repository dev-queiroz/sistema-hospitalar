import { supabase } from '../../../config/supabase';
import { Prescricao } from '../models/prescricao';
import { Encaminhamento } from '../models/encaminhamento';

export const criarPrescricao = async (prescricaoData: Prescricao) => {
    const { data, error } = await supabase
        .from('prescricoes')
        .insert(prescricaoData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const criarEncaminhamento = async (encaminhamentoData: Encaminhamento) => {
    const { data, error } = await supabase
        .from('encaminhamentos')
        .insert(encaminhamentoData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};