import {Internacao} from '../models/Internacao';

export interface IInternacaoRepository {
    findAll(): Promise<Internacao[]>;

    findById(id: string): Promise<Internacao | null>;

    findByPacienteId(pacienteId: string): Promise<Internacao[]>;

    insert(internacao: Internacao): Promise<Internacao>;

    update(id: string, internacao: Internacao): Promise<Internacao>;

    delete(id: string): Promise<void>;
}