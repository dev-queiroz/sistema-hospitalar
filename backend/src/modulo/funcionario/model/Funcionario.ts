import {Paciente} from '../../paciente/model/Paciente';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

export abstract class Funcionario extends Paciente {
    papel: Papeis;
    dataContratacao: Date;
    registroProfissional: string; // CRM, COREN

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
        papel: Papeis,
        dataContratacao: Date,
        registroProfissional: string,
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
            email
        );
        this.papel = papel;
        this.dataContratacao = dataContratacao;
        this.registroProfissional = registroProfissional;
    }
}