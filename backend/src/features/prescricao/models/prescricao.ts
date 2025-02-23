export interface Prescricao {
    id?: string;
    patient_id: string;
    professional_id: string;
    detalhes: Record<string, any>;
    data?: string;
}