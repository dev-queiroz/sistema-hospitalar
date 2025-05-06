class Medicamento extends BaseEntity {
    nome: string;
    principioAtivo: string;

    constructor(id: string, nome: string, principioAtivo: string) {
        super(id);
        this.nome = nome;
        this.principioAtivo = principioAtivo;
    }
}