import {Funcionario} from '../../funcionario/model/Funcionario';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

export class Enfermeiro extends Funcionario {
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
        dataContratacao: Date,
        coren: string,
        email?: string
    ) {
        super(
            id,
            nome,
            cpf,
            cns,
            dataNascimento,
            sexo,
            racaCor,
            escolaridade,
            endereco,
            telefone,
            gruposRisco,
            consentimentoLGPD,
            Papeis.ENFERMEIRO,
            dataContratacao,
            coren,
            email
        );
    }
}