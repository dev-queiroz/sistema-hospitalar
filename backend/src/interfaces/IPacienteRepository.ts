import {Paciente} from '../models/Paciente';

export interface IPacienteRepository {
    findAll(): Promise<Paciente[]>;

    findById(id: string): Promise<Paciente | null>;

    findByCpf(cpf: string): Promise<Paciente | null>;

    insert(paciente: Paciente): Promise<Paciente>;

    update(id: string, paciente: Paciente): Promise<Paciente>;

    delete(id: string): Promise<void>;
}