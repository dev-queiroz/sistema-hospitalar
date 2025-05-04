export class Exame {
    id: string;
    consulta_id: string;
    paciente_id: string;
    tipo_exame: string;
    resultado?: string;
    status: 'pendente' | 'realizado' | 'cancelado';
    data_resultado?: string;
    created_at?: string;
    updated_at?: string;
}
