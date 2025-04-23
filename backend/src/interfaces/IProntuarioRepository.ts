import {Prontuario} from '../models/Prontuario';

export interface IProntuarioRepository {
    findAll(): Promise<Prontuario[]>;

    findById(id: string): Promise<Prontuario | null>;

    findByPacienteId(pacienteId: string): Promise<Prontuario[]>;

    insert(prontuario: Prontuario): Promise<Prontuario>;

    update(id: string, prontuario: Prontuario): Promise<Prontuario>;

    delete(id: string): Promise<void>;
}