import { supabase } from '../../../config/supabase';
import { Patient } from '../models/patient';
import { Professional } from '../models/professional';

export const registerPatient = async (patientData: Patient) => {
    const { sus_number, nome, data_nasc, endereco, contato } = patientData;
    const email = `${sus_number}@pedrabranca.local`;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: sus_number });
    if (authError) throw new Error(authError.message);
    const { data, error } = await supabase
        .from('patients')
        .insert({ sus_number, nome, data_nasc, endereco, contato, user_id: authData.user?.id })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const registerProfessional = async (profData: Professional & { email: string; password: string }) => {
    const { email, password, nome, crm_coren, especializacao, unidade_saude, cargo } = profData;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw new Error(authError.message);
    const { data, error } = await supabase
        .from('professionals')
        .insert({ nome, crm_coren, especializacao, unidade_saude, cargo, user_id: authData.user?.id })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const login = async ({ identifier, password }: { identifier: string; password: string }) => {
    const isSUS = /^\d{15}$/.test(identifier);
    const email = isSUS ? `${identifier}@pedrabranca.local` : identifier;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { user: data.user, token: data.session?.access_token };
};