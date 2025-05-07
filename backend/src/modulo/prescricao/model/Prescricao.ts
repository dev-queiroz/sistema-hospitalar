import {BaseEntity} from '../../core/model/BaseEntity';

export class Prescricao extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    data: Date;
    detalhesPrescricao: string; // Texto descritivo, ex.: "Paracetamol 500mg, 1 comprimido a cada 6h por 3 dias"
    cid10: string; // Código da Classificação Internacional de Doenças

    constructor(id: string, pacienteId: string, profissionalId: string, detalhesPrescricao: string, cid10: string) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
        this.detalhesPrescricao = detalhesPrescricao;
        this.cid10 = cid10;
    }
}