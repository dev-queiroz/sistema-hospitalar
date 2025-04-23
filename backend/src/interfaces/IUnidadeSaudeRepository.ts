import {UnidadeSaude} from '../models/UnidadeSaude';

export interface IUnidadeSaudeRepository {
    findAll(): Promise<UnidadeSaude[]>;

    findById(id: string): Promise<UnidadeSaude | null>;

    insert(unidade: UnidadeSaude): Promise<UnidadeSaude>;

    update(id: string, unidade: UnidadeSaude): Promise<UnidadeSaude>;

    delete(id: string): Promise<void>;
}