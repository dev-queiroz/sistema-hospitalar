import {BaseEntity} from '../../core/model/BaseEntity';

export class Consulta extends BaseEntity {
    pacienteId: string;
    profissionalId: string; // Médico ou Enfermeiro (em UPAs)
    unidadeSaudeId: string;
    quartoId?: string; // Opcional, se a consulta ocorre em um quarto
    data: Date;
    observacoes: string;
    cid10?: string; // Diagnóstico principal

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        observacoes: string,
        quartoId?: string,
        cid10?: string
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.unidadeSaudeId = unidadeSaudeId;
        this.quartoId = quartoId;
        this.data = new Date();
        this.observacoes = observacoes;
        this.cid10 = cid10;
    }
}