import {BaseEntity} from '../../core/model/BaseEntity';
import {Escolaridade, NivelGravidade, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';
import {Prontuario} from '../../prontuario/model/Prontuario';
import {Prescricao} from '../../prescricao/model/Prescricao';
import {Consulta} from '../../consulta/model/Consulta';

export class Paciente extends BaseEntity {
    nome: string;
    cpf: string;
    cns: string; // Cartão Nacional de Saúde
    dataNascimento: Date;
    sexo: Sexo;
    racaCor: RacaCor;
    escolaridade: Escolaridade;
    endereco: Endereco;
    telefone: string;
    email?: string;
    gruposRisco: string[]; // Ex.: "IDOSO", "GESTANTE", "DIABETICO"
    nivelGravidade?: NivelGravidade;
    consentimentoLGPD: boolean; // Consentimento para dados pessoais
    prontuarios: Prontuario[] = [];
    prescricoes: Prescricao[] = [];
    consultas: Consulta[] = [];

    constructor(
        id: string,
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        gruposRisco: string[],
        consentimentoLGPD: boolean,
        email?: string
    ) {
        super(id);
        this.nome = nome;
        this.cpf = cpf;
        this.cns = cns;
        this.dataNascimento = dataNascimento;
        this.sexo = sexo;
        this.racaCor = racaCor;
        this.escolaridade = escolaridade;
        this.endereco = endereco;
        this.telefone = telefone;
        this.email = email;
        this.gruposRisco = gruposRisco;
        this.consentimentoLGPD = consentimentoLGPD;
    }
}