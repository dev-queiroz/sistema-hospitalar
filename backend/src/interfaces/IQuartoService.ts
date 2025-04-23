import {Quarto} from '../models/Quarto';

export interface IQuartoService {
    getAll(): Promise<Quarto[]>;

    getById(id: string): Promise<Quarto | null>;

    create(quarto: Quarto): Promise<Quarto>;

    update(id: string, quarto: Quarto): Promise<Quarto>;

    delete(id: string): Promise<void>;
}