import {ConfiguracaoRede} from '../models/ConfiguracaoRede';

export interface IConfiguracaoRedeRepository {
    findAll(): Promise<ConfiguracaoRede[]>;

    findById(id: string): Promise<ConfiguracaoRede | null>;

    findByUnidadeId(unidadeId: string): Promise<ConfiguracaoRede[]>;

    insert(configuracao: ConfiguracaoRede): Promise<ConfiguracaoRede>;

    update(id: string, configuracao: ConfiguracaoRede): Promise<ConfiguracaoRede>;

    delete(id: string): Promise<void>;
}