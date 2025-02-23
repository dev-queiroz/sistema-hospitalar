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

export const subscribeToProntuarioChanges = (
    patientId: string | null,
    callback: (payload: any) => void
) => {
    const channel = supabase
        .channel('prontuarios')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'prontuarios',
                ...(patientId ? { filter: `patient_id=eq.${patientId}` } : {}), // Filtra por patient_id, se fornecido
            },
            (payload: any) => {
                console.log('Change received!', payload);
                callback(payload);
            }
        )
        .subscribe((status: any) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to prontuarios${patientId ? ` for patient ${patientId}` : ''}`);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                console.error('Subscription failed or closed:', status);
            }
        });

    return () => {
        supabase.removeChannel(channel);
        console.log('Unsubscribed from prontuarios');
    };
};