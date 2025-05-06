class Prontuario extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    data: Date;
    descricao: string;

    constructor(id: string, pacienteId: string, profissionalId: string, descricao: string) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
        this.descricao = descricao;
    }
}