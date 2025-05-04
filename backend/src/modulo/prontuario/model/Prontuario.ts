export class Prontuario {
    id: string;
    paciente_id: string;
    anamnese: string;
    exames_objetivos: string;
    prescricao_medicamentos?: string;
    atestados?: string;
    solicitacao_exames?: string[];
    created_at?: string;
    updated_at?: string;
}
