import {Papeis} from "../../../shared/types/types";
import {Funcionario} from "../../funcionario/model/Funcionario";

class Enfermeiro extends Funcionario {
    coren: string;

    constructor(id: string, nome: string, cpf: string, dataNascimento: Date, coren: string) {
        super(id, nome, cpf, dataNascimento, Papeis.ENFERMEIRO);
        this.coren = coren;
    }
}