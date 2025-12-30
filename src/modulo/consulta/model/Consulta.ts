import {BaseEntity} from '../../core/model/BaseEntity';

export interface Paciente{
    nome: string;
}

export interface Medico {
    nome: string;
}

export class Consulta extends BaseEntity {
    pacienteId: string;
    profissionalId: string;
    unidadeSaudeId: string;
    data_consulta: Date;
    observacoes: string;
    cid10?: string | null;
    paciente_nome?: Paciente["nome"];
    medicoNome?: Medico["nome"];

    constructor(
        id: string,
        pacienteId: string,
        profissionalId: string,
        unidadeSaudeId: string,
        data_consulta: Date,
        observacoes: string,
        cid10?: string | null,
        paciente_nome?: Paciente["nome"],
        medicoNome?: Medico["nome"]
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.profissionalId = profissionalId;
        this.unidadeSaudeId = unidadeSaudeId;
        this.data_consulta = data_consulta;
        this.observacoes = observacoes;
        this.cid10 = cid10;
        this.paciente_nome = paciente_nome;
        this.medicoNome = medicoNome;
    }
}