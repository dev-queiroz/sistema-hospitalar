import {Leito} from '../models/Leito';

export interface ILeitoRepository {
    findAll(): Promise<Leito[]>;

    findById(id: string): Promise<Leito | null>;

    findByQuartoId(quartoId: string): Promise<Leito[]>;

    insert(leito: Leito): Promise<Leito>;

    update(id: string, leito: Leito): Promise<Leito>;

    delete(id: string): Promise<void>;
}