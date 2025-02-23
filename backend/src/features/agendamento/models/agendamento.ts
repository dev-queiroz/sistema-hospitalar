export interface Agendamento {
    id?: string;
    patient_id: string;
    professional_id: string;
    data_hora: string;
    tipo: string;
    prioridade: boolean;
}