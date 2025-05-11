import {BaseEntity} from '../../core/model/BaseEntity';

export class Consulta extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    unidadeSaudeId: string;
    data: Date;
    observacoes: string;
    cid10?: string | null;

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        dataConsulta: Date,
        observacoes: string,
        cid10?: string | null
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.unidadeSaudeId = unidadeSaudeId;
        this.data = new Date();
        this.observacoes = observacoes;
        this.cid10 = cid10;
    }
}