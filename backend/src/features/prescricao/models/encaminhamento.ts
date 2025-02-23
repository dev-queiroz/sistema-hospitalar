export interface Encaminhamento {
    id?: string;
    patient_id: string;
    professional_id: string;
    especialidade: string;
    motivo: string;
    urgencia: boolean;
    status: 'pendente' | 'agendado' | 'realizado';
    data?: string;
}