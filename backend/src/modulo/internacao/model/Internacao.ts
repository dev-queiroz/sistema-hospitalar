export class Internacao {
    id: string;
    paciente_id: string;
    medico_id: string;
    leito_id: string;
    data_entrada: string;
    data_saida?: string;
    motivo: string;
    status: 'ativa' | 'transferida' | 'alta' | 'cancelada';
    created_at?: string;
    updated_at?: string;
}
