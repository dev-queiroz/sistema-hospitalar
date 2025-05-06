import {Funcionario} from "../../funcionario/model/Funcionario";
import {Papeis} from "../../../shared/types/types";

class Farmaceutico extends Funcionario {
    crf: string;

    constructor(id: string, nome: string, cpf: string, dataNascimento: Date, crf: string) {
        super(id, nome, cpf, dataNascimento, Papeis.FARMACEUTICO);
        this.crf = crf;
    }
}