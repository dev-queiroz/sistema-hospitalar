import {NivelGravidade} from "../../../shared/types/types";

class Paciente extends BaseEntity {
    nome: string;
    cpf: string;
    cns: string; // Cartão Nacional de Saúde
    dataNascimento: Date;
    nivelGravidade?: NivelGravidade;
    gruposRisco: string[]; // Ex.: "IDOSO", "GESTANTE"
    prontuarios: Prontuario[] = [];
    prescricoes: Prescricao[] = [];
    consultas: Consulta[] = [];
    internacoes: Internacao[] = [];
    funcionarioId?: string; // Se é funcionário

    constructor(
        id: string,
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        gruposRisco: string[]
    ) {
        super(id);
        this.nome = nome;
        this.cpf = cpf;
        this.cns = cns;
        this.dataNascimento = dataNascimento;
        this.gruposRisco = gruposRisco;
    }
}