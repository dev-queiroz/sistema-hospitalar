import {BaseEntity} from '../../core/model/BaseEntity';

export class Prontuario extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    unidadeSaudeId: string;
    data: Date;
    descricao: string;
    cid10?: string;

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        descricao: string,
        cid10?: string,
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
        this.descricao = descricao;
        this.cid10 = cid10;
        this.unidadeSaudeId = unidadeSaudeId;
    }
}