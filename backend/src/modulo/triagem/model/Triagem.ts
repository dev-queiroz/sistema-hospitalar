import {NivelGravidade} from "../../../shared/types/types";

class Triagem extends BaseEntity {
    pacienteId: string;
    enfermeiroId: string;
    nivelGravidade: NivelGravidade;
    data: Date;

    constructor(id: string, pacienteId: string, enfermeiroId: string, nivelGravidade: NivelGravidade) {
        super(id);
        this.pacienteId = pacienteId;
        this.enfermeiroId = enfermeiroId;
        this.nivelGravidade = nivelGravidade;
        this.data = new Date();
    }
}