export interface CriarConsultaDTO {
    paciente_id: string;
    medico_id: string;
    data_hora: string;
    tipo_consulta: 'primeira' | 'retorno' | 'urgencia';
}

export interface AtualizarConsultaDTO {
    data_hora?: string;
    tipo_consulta?: 'primeira' | 'retorno' | 'urgencia';
    status?: 'agendada' | 'realizada' | 'cancelada';
}
