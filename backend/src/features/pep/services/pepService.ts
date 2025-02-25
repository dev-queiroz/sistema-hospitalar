import { supabase } from '../../../config/supabase';
import { Prontuario } from '../models/prontuario';

export const createProntuario = async (prontuarioData: Prontuario) => {
    const { data, error } = await supabase
        .from('prontuarios')
        .insert(prontuarioData)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getProntuario = async (patientId: string) => {
    const { data, error } = await supabase
        .from('prontuarios')
        .select('*')
        .eq('patient_id', patientId)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getPatientByIdentifier = async (identifier: string) => {
    const { data: patientBySus, error: susError } = await supabase
        .from('patients')
        .select('id, sus_number, cpf, nome')
        .eq('sus_number', identifier)
        .single();

    if (!patientBySus) {
        const { data: patientByCpf, error: cpfError } = await supabase
            .from('patients')
            .select('id, sus_number, cpf, nome')
            .eq('cpf', identifier)
            .single();
        if (cpfError) throw new Error('Paciente não encontrado');
        return patientByCpf;
    }
    if (susError) throw new Error('Paciente não encontrado');
    return patientBySus;
};

export const subscribeToProntuarioChanges = (patientId: string | null, callback: (payload: any) => void) => {
    const channel = supabase
        .channel('prontuarios')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'prontuarios',
                filter: patientId ? `patient_id=eq.${patientId}` : undefined
            }, callback)
        .subscribe();
    return () => supabase.removeChannel(channel);
};

export const updateProntuario = async (patientId: string, historyUpdate: Record<string, any>) => {
    const { data: existing, error: fetchError } = await supabase
        .from('prontuarios')
        .select('*')
        .eq('patient_id', patientId)
        .single();

    const updatedHistory = existing ? { ...existing.history, ...historyUpdate } : historyUpdate;
    const { data, error } = await supabase
        .from('prontuarios')
        .upsert({ patient_id: patientId, history: updatedHistory })
        .select()
        .single();
    if (error || fetchError) throw new Error(error?.message || fetchError?.message);
    return data;
};