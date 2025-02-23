export interface Prontuario {
    id?: string;
    patient_id: string;
    history: Record<string, any>;
    updated_at?: string;
}