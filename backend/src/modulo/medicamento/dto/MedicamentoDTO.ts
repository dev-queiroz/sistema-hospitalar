export interface CriarMedicamentoDTO {
    nome: string;
    principio_ativo: string;
    concentracao: string;
    forma_farmaceutica: string;
    via_administracao: string;
    controlado: boolean;
}

export interface AtualizarMedicamentoDTO extends Partial<CriarMedicamentoDTO> {
}
