class Quarto extends BaseEntity {
    numero: string;
    unidadeSaudeId: string;
    leitos: Leito[] = [];

    constructor(id: string, numero: string, unidadeSaudeId: string) {
        super(id);
        this.numero = numero;
        this.unidadeSaudeId = unidadeSaudeId;
    }
}