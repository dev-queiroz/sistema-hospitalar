export interface SolicitarExameDTO {
    consulta_id: string;
    paciente_id: string;
    tipo_exame: string;
}

export interface AtualizarExameResultadoDTO {
    resultado: string;
    data_resultado: string;
}

export interface AtualizarStatusExameDTO {
    status: 'pendente' | 'realizado' | 'cancelado';
}
