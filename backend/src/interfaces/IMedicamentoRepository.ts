import {Medicamento} from '../models/Medicamento';

export interface IMedicamentoRepository {
    findAll(): Promise<Medicamento[]>;

    findById(id: string): Promise<Medicamento | null>;

    insert(medicamento: Medicamento): Promise<Medicamento>;

    update(id: string, medicamento: Medicamento): Promise<Medicamento>;

    delete(id: string): Promise<void>;
}