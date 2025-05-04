export interface CriarPacienteDTO {
    pessoa_id: string;
    cartao_sus: string;
    data_cadastro: string;
    grupo_risco?: string;
}

export interface AtualizarPacienteDTO extends Partial<CriarPacienteDTO> {
}
