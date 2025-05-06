import {Papeis} from "../../../shared/types/types";

export abstract class Funcionario extends BaseEntity {
    nome: string;
    cpf: string;
    dataNascimento: Date;
    papel: Papeis;

    constructor(id: string, nome: string, cpf: string, dataNascimento: Date, papel: Papeis) {
        super(id);
        this.nome = nome;
        this.cpf = cpf;
        this.dataNascimento = dataNascimento;
        this.papel = papel;
    }
}