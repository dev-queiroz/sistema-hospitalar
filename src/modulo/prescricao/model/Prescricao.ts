import {BaseEntity} from '../../core/model/BaseEntity';

export class Prescricao extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    unidadeSaudeId: string;
    detalhesPrescricao: string;
    cid10: string;
    createdAt: Date

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        detalhesPrescricao: string,
        cid10: string,
        createdAt: Date
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.unidadeSaudeId = unidadeSaudeId;
        this.detalhesPrescricao = detalhesPrescricao;
        this.cid10 = cid10;
        this.createdAt = createdAt;
    }
}