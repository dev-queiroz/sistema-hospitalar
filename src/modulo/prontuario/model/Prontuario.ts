import {BaseEntity} from '../../core/model/BaseEntity';

export class Prontuario extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    unidadeSaudeId: string;
    data: Date;
    descricao: string;
    dadosAnonimizados: Record<string, string>;

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        descricao: string,
        dadosAnonimizados: Record<string, string>
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
        this.descricao = descricao;
        this.dadosAnonimizados = dadosAnonimizados;
        this.unidadeSaudeId = unidadeSaudeId;
    }
}