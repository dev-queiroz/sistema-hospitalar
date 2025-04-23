import {Funcionario} from '../models/Funcionario';

export interface IFuncionarioRepository {
    findAll(): Promise<Funcionario[]>;

    findById(id: string): Promise<Funcionario | null>;

    findByCpf(cpf: string): Promise<Funcionario | null>;

    insert(funcionario: Funcionario): Promise<Funcionario>;

    update(id: string, funcionario: Funcionario): Promise<Funcionario>;

    delete(id: string): Promise<void>;
}