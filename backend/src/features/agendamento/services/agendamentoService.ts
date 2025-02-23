import { supabase } from '../../../config/supabase';
import { Agendamento } from '../models/agendamento';

export const criarAgendamento = async (agendamentoData: Agendamento) => {
    const { data, error } = await supabase
        .from('agendamentos')
        .insert(agendamentoData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};