import {Funcionario} from '../models/Funcionario';

export interface IFuncionarioService {
    getAll(): Promise<Funcionario[]>;

    getById(id: string): Promise<Funcionario | null>;

    create(funcionario: Funcionario): Promise<Funcionario>;

    update(id: string, funcionario: Funcionario): Promise<Funcionario>;

    delete(id: string): Promise<void>;
}