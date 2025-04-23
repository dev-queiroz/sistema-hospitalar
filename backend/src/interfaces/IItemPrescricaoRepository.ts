import {ItemPrescricao} from '../models/ItemPrescricao';

export interface IItemPrescricaoRepository {
    findAll(): Promise<ItemPrescricao[]>;

    findById(id: string): Promise<ItemPrescricao | null>;

    findByPrescricaoId(prescricaoId: string): Promise<ItemPrescricao[]>;

    insert(item: ItemPrescricao): Promise<ItemPrescricao>;

    update(id: string, item: ItemPrescricao): Promise<ItemPrescricao>;

    delete(id: string): Promise<void>;
}