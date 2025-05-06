class Consulta extends BaseEntity {
    pacienteId: string;
    medicoId: string;
    data: Date;
    observacoes: string;

    constructor(id: string, pacienteId: string, medicoId: string, observacoes: string) {
        super(id);
        this.pacienteId = pacienteId;
        this.medicoId = medicoId;
        this.data = new Date();
        this.observacoes = observacoes;
    }
}