import {Exame} from '../models/Exame';

export interface IExameRepository {
    findAll(): Promise<Exame[]>;

    findById(id: string): Promise<Exame | null>;

    findByConsultaId(consultaId: string): Promise<Exame[]>;

    insert(exame: Exame): Promise<Exame>;

    update(id: string, exame: Exame): Promise<Exame>;

    delete(id: string): Promise<void>;
}