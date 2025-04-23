export class Medicamento {
    private id: string;
    private nome: string;
    private descricao: string;

    constructor(id: string, nome: string, descricao: string) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getNome(): string {
        return this.nome;
    }

    public getDescricao(): string {
        return this.descricao;
    }
}