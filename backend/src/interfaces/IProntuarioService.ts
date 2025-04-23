import {Prontuario} from '../models/Prontuario';

export interface IProntuarioService {
    getAll(): Promise<Prontuario[]>;

    getById(id: string): Promise<Prontuario | null>;

    create(prontuario: Prontuario): Promise<Prontuario>;

    update(id: string, prontuario: Prontuario): Promise<Prontuario>;

    delete(id: string): Promise<void>;

    atualizarDados(prontuario: Prontuario, dados: string): Promise<void>;
}