class ItemPrescricao extends BaseEntity {
    prescricaoId: string;
    medicamentoId: string;
    dosagem: string;
    frequencia: string;

    constructor(
        id: string,
        prescricaoId: string,
        medicamentoId: string,
        dosagem: string,
        frequencia: string
    ) {
        super(id);
        this.prescricaoId = prescricaoId;
        this.medicamentoId = medicamentoId;
        this.dosagem = dosagem;
        this.frequencia = frequencia;
    }
}