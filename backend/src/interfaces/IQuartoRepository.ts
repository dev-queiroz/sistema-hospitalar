import {Quarto} from '../models/Quarto';

export interface IQuartoRepository {
    findAll(): Promise<Quarto[]>;

    findById(id: string): Promise<Quarto | null>;

    findByUnidadeId(unidadeId: string): Promise<Quarto[]>;

    insert(quarto: Quarto): Promise<Quarto>;

    update(id: string, quarto: Quarto): Promise<Quarto>;

    delete(id: string): Promise<void>;
}