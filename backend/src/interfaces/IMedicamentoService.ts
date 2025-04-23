import {Medicamento} from '../models/Medicamento';

export interface IMedicamentoService {
    getAll(): Promise<Medicamento[]>;

    getById(id: string): Promise<Medicamento | null>;

    create(medicamento: Medicamento): Promise<Medicamento>;

    update(id: string, medicamento: Medicamento): Promise<Medicamento>;

    delete(id: string): Promise<void>;
}