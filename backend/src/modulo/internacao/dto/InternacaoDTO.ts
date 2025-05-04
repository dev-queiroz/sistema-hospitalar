export interface CriarInternacaoDTO {
    paciente_id: string;
    medico_id: string;
    leito_id: string;
    motivo: string;
    data_entrada: string;
}

export interface TransferirInternacaoDTO {
    internacao_id: string;
    novo_leito_id: string;
}

export interface AltaInternacaoDTO {
    internacao_id: string;
    data_saida: string;
}
