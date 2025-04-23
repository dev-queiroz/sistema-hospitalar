import {Recepcionista} from '../models/Recepcionista';
import {Paciente} from '../models/Paciente';

export interface IRecepcionistaService {
    getAll(): Promise<Recepcionista[]>;

    getById(id: string): Promise<Recepcionista | null>;

    create(recepcionista: Recepcionista): Promise<Recepcionista>;

    update(id: string, recepcionista: Recepcionista): Promise<Recepcionista>;

    delete(id: string): Promise<void>;

    realizarTriagem(recepcionistaId: string, paciente: Paciente, classificacaoRisco: string): Promise<void>;
}