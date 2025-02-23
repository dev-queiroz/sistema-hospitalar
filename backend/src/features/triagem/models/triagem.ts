export interface Triagem {
    id?: string;
    patient_id: string;
    sinais_vitais?: Record<string, any>;
    sintomas: string;
    classificacao_risco: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
    data_hora?: string;
}