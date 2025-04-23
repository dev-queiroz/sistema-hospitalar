import {Exame} from '../models/Exame';

export interface IExameService {
    getAll(): Promise<Exame[]>;

    getById(id: string): Promise<Exame | null>;

    create(exame: Exame): Promise<Exame>;

    update(id: string, exame: Exame): Promise<Exame>;

    delete(id: string): Promise<void>;

    atualizarResultados(exame: Exame, resultados: string): Promise<void>;
}