import {EstoqueMedicamento} from '../models/EstoqueMedicamento';
import {Medicamento} from '../models/Medicamento';
import {UnidadeSaude} from '../models/UnidadeSaude';

export interface IEstoqueMedicamentoService {
    getAll(): Promise<EstoqueMedicamento[]>;

    getById(id: string): Promise<EstoqueMedicamento | null>;

    create(estoque: EstoqueMedicamento): Promise<EstoqueMedicamento>;

    update(id: string, estoque: EstoqueMedicamento): Promise<EstoqueMedicamento>;

    delete(id: string): Promise<void>;

    adicionarMedicamento(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void>;

    retirarMedicamento(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void>;

    verificarEstoque(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void>;
}