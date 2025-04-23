import {Paciente} from '../models/Paciente';

export interface IPacienteService {
    getAll(): Promise<Paciente[]>;

    getById(id: string): Promise<Paciente | null>;

    create(paciente: Paciente): Promise<Paciente>;

    update(id: string, paciente: Paciente): Promise<Paciente>;

    delete(id: string): Promise<void>;
}