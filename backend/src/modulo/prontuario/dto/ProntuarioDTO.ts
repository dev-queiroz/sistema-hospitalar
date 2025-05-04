export interface CriarProntuarioDTO {
    paciente_id: string;
    anamnese: string;
    exames_objetivos: string;
    prescricao_medicamentos?: string;
    atestados?: string;
    solicitacao_exames?: string[];
}

export interface AtualizarProntuarioDTO extends Partial<CriarProntuarioDTO> {
}
