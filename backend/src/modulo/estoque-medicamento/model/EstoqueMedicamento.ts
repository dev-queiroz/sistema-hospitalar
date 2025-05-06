class EstoqueMedicamento extends BaseEntity {
    unidadeSaudeId: string;
    medicamentoId: string;
    quantidade: number;

    constructor(id: string, unidadeSaudeId: string, medicamentoId: string, quantidade: number) {
        super(id);
        this.unidadeSaudeId = unidadeSaudeId;
        this.medicamentoId = medicamentoId;
        this.quantidade = quantidade;
    }
}