export interface CriarItemPrescricaoDTO {
    prescricao_id: string;
    medicamento_id?: string;
    exame_id?: string;
    dosagem?: string;
    frequencia?: string;
    duracao?: string;
    instrucoes?: string;
}

export interface AtualizarItemPrescricaoDTO extends Partial<CriarItemPrescricaoDTO> {
}