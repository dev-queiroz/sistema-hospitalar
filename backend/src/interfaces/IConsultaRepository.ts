import {Consulta} from '../models/Consulta';

export interface IConsultaRepository {
    findAll(): Promise<Consulta[]>;

    findById(id: string): Promise<Consulta | null>;

    findByPacienteId(pacienteId: string): Promise<Consulta[]>;

    insert(consulta: Consulta): Promise<Consulta>;

    update(id: string, consulta: Consulta): Promise<Consulta>;

    delete(id: string): Promise<void>;
}