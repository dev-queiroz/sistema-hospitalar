import {EstoqueMedicamento} from '../models/EstoqueMedicamento';

export interface IEstoqueMedicamentoRepository {
    findAll(): Promise<EstoqueMedicamento[]>;

    findById(id: string): Promise<EstoqueMedicamento | null>;

    findByUnidadeId(unidadeId: string): Promise<EstoqueMedicamento[]>;

    insert(estoque: EstoqueMedicamento): Promise<EstoqueMedicamento>;

    update(id: string, estoque: EstoqueMedicamento): Promise<EstoqueMedicamento>;

    delete(id: string): Promise<void>;
}