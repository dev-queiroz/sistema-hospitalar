class Prescricao extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    data: Date;
    itens: ItemPrescricao[] = [];

    constructor(id: string, pacienteId: string, profissionalId: string) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
    }
}