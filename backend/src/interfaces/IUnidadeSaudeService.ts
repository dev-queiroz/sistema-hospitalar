import {UnidadeSaude} from '../models/UnidadeSaude';

export interface IUnidadeSaudeService {
    getAll(): Promise<UnidadeSaude[]>;

    getById(id: string): Promise<UnidadeSaude | null>;

    create(unidade: UnidadeSaude): Promise<UnidadeSaude>;

    update(id: string, unidade: UnidadeSaude): Promise<UnidadeSaude>;

    delete(id: string): Promise<void>;
}