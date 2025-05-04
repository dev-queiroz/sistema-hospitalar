export interface CriarLeitoDTO {
    quarto_id: string;
    codigo: string;
}

export interface AtualizarLeitoDTO extends Partial<CriarLeitoDTO> {
}
