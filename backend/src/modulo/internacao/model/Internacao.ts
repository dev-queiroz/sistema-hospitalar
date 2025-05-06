class Internacao extends BaseEntity {
    pacienteId: string;
    leitoId: string;
    dataEntrada: Date;
    motivo: string;

    constructor(id: string, pacienteId: string, leitoId: string, motivo: string) {
        super(id);
        this.pacienteId = pacienteId;
        this.leitoId = leitoId;
        this.dataEntrada = new Date();
        this.motivo = motivo;
    }
}