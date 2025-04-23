import {ItemPrescricao} from '../models/ItemPrescricao';

export interface IItemPrescricaoService {
    getAll(): Promise<ItemPrescricao[]>;

    getById(id: string): Promise<ItemPrescricao | null>;

    create(item: ItemPrescricao): Promise<ItemPrescricao>;

    update(id: string, item: ItemPrescricao): Promise<ItemPrescricao>;

    delete(id: string): Promise<void>;
}