export interface AdicionarEstoqueDTO {
    unidade_saude_id: string;
    medicamento_id: string;
    quantidade: number;
}

export interface RemoverEstoqueDTO extends AdicionarEstoqueDTO {
}

export interface TransferirEstoqueDTO {
    de_unidade_id: string;
    para_unidade_id: string;
    medicamento_id: string;
    quantidade: number;
}
