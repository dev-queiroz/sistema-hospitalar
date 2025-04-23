import {Leito} from '../models/Leito';

export interface ILeitoService {
    getAll(): Promise<Leito[]>;

    getById(id: string): Promise<Leito | null>;

    create(leito: Leito): Promise<Leito>;

    update(id: string, leito: Leito): Promise<Leito>;

    delete(id: string): Promise<void>;

    atualizarDisponibilidade(leito: Leito, status: string): Promise<void>;
}