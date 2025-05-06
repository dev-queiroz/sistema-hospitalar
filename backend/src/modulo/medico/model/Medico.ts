import {Funcionario} from "../../funcionario/model/Funcionario";
import {Papeis} from "../../../shared/types/types";

class Medico extends Funcionario {
    crm: string;
    consultas: Consulta[] = [];

    constructor(id: string, nome: string, cpf: string, dataNascimento: Date, crm: string) {
        super(id, nome, cpf, dataNascimento, Papeis.MEDICO);
        this.crm = crm;
    }
}