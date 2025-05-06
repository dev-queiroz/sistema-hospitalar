class Leito extends BaseEntity {
    numero: string;
    quartoId: string;
    ocupado: boolean;
    internacaoId?: string;

    constructor(id: string, numero: string, quartoId: string) {
        super(id);
        this.numero = numero;
        this.quartoId = quartoId;
        this.ocupado = false;
    }
}