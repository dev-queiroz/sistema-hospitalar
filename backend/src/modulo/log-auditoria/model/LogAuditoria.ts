class LogAuditoria extends BaseEntity {
    usuarioId: string;
    acao: string;
    entidade: string;
    entidadeId: string;
    data: Date;

    constructor(id: string, usuarioId: string, acao: string, entidade: string, entidadeId: string) {
        super(id);
        this.usuarioId = usuarioId;
        this.acao = acao;
        this.entidade = entidade;
        this.entidadeId = entidadeId;
        this.data = new Date();
    }
}