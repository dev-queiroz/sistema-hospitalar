import { supabase } from '../../../config/supabase';
import { Patient } from '../models/patient';
import { Professional } from '../models/professional';

export const registerPatient = async (patientData: Patient) => {
    const { sus_number, rg, cpf, nome, data_nasc, endereco, contato } = patientData;
    if (!sus_number || !cpf || !nome || !data_nasc || !endereco || !contato) {
        throw new Error('Campos obrigatórios: sus_number, cpf, nome, data_nasc, endereco, contato');
    }

    const email = `${sus_number}@hospital.local`;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: sus_number });
    if (authError) throw new Error(authError.message);

    const { data, error } = await supabase
        .from('patients')
        .insert({ sus_number, rg, cpf, nome, data_nasc, endereco, contato, user_id: authData.user?.id })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const registerProfessional = async (profData: Professional) => {
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
    const { data: patientBySus, error: susError } = await supabase
        .from('patients')
        .select('sus_number')
        .eq('sus_number', identifier)
        .single();

    const { data: patientByCpf, error: cpfError } = await supabase
        .from('patients')
        .select('cpf')
        .eq('cpf', identifier)
        .single();

    const cpf = patientBySus?.sus_number || patientByCpf?.cpf;
    if (susError && cpfError || !cpf) {
        const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('email')
            .eq('email', identifier)
            .single();
        if (profError || !profData) throw new Error('Usuário não encontrado');
        identifier = profData.email;
    } else {
        identifier = `${cpf}@hospital.local`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (error) throw new Error(error.message);

    return { user: data.user, token: data.session?.access_token };
};

export const registerAdmin = async (adminData: { email: string; password: string; nome: string }) => {
    const { email, password, nome } = adminData;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw new Error(authError.message);

    const { error: updateError } = await supabase.auth.updateUser({ data: { role: 'admin' } });
    if (updateError) throw new Error(updateError.message);

    const { data, error } = await supabase
        .from('professionals')
        .insert({ nome, user_id: authData.user?.id, role: 'admin' })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateUserRole = async (userId: string, newRole: string, requesterRole: string) => {
    if (requesterRole !== 'admin') throw new Error('Apenas administradores podem alterar papéis');

    const { error } = await supabase.auth.admin.updateUserById(userId, { role: newRole });
    if (error) throw new Error(error.message);

    await supabase
        .from('professionals')
        .update({ role: newRole })
        .eq('user_id', userId);
};