import {Funcionario} from './Funcionario';

export class LogAuditoria {
    private id: string;
    protected usuario: Funcionario;
    private acao: string;
    private tabela: string;
    private registroId: string;
    private data: Date;

    constructor(id: string, usuario: Funcionario, acao: string, tabela: string, registroId: string) {
        this.id = id;
        this.usuario = usuario;
        this.acao = acao;
        this.tabela = tabela;
        this.registroId = registroId;
        this.data = new Date();
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUsuario(): Funcionario {
        return this.usuario;
    }

    public getAcao(): string {
        return this.acao;
    }

    public getTabela(): string {
        return this.tabela;
    }

    public getRegistroId(): string {
        return this.registroId;
    }

    public getData(): Date {
        return this.data;
    }

    public registrarLog(): void {
        console.log(this.formatarLog());
    }

    protected formatarLog(): string {
        return `[${this.data.toISOString()}] ${this.usuario.getNome()} - ${this.acao} em ${this.tabela} (ID: ${this.registroId})`;
    }
}