import { BaseEntity } from '../../core/model/BaseEntity';

export class Prontuario extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    data: Date;
    descricao: string;
    dadosAnonimizados: boolean; // Para análises estatísticas

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        descricao: string,
        dadosAnonimizados: boolean
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.data = new Date();
        this.descricao = descricao;
        this.dadosAnonimizados = dadosAnonimizados;
    }
}