export class Consulta {
    id: string;
    paciente_id: string;
    medico_id: string;
    data_hora: string;
    tipo_consulta: 'primeira' | 'retorno' | 'urgencia';
    status: 'agendada' | 'realizada' | 'cancelada';
    created_at?: string;
    updated_at?: string;
}
