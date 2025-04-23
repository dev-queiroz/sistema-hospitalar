import {ConfiguracaoRede} from '../models/ConfiguracaoRede';

export interface IConfiguracaoRedeService {
    getAll(): Promise<ConfiguracaoRede[]>;

    getById(id: string): Promise<ConfiguracaoRede | null>;

    create(configuracao: ConfiguracaoRede): Promise<ConfiguracaoRede>;

    update(id: string, configuracao: ConfiguracaoRede): Promise<ConfiguracaoRede>;

    delete(id: string): Promise<void>;

    configurarVPN(configuracao: ConfiguracaoRede, ip: string, port: number): Promise<void>;
}