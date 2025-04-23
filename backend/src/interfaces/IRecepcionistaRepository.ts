import {Recepcionista} from '../models/Recepcionista';

export interface IRecepcionistaRepository {
    findAll(): Promise<Recepcionista[]>;

    findById(id: string): Promise<Recepcionista | null>;

    findByCpf(cpf: string): Promise<Recepcionista | null>;

    insert(recepcionista: Recepcionista): Promise<Recepcionista>;

    update(id: string, recepcionista: Recepcionista): Promise<Recepcionista>;

    delete(id: string): Promise<void>;
}