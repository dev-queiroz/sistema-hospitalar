import {RelatorioMedico} from '../models/RelatorioMedico';

export interface IRelatorioMedicoService {
    getAll(): Promise<RelatorioMedico[]>;

    getById(id: string): Promise<RelatorioMedico | null>;

    create(relatorio: RelatorioMedico): Promise<RelatorioMedico>;

    update(id: string, relatorio: RelatorioMedico): Promise<RelatorioMedico>;

    delete(id: string): Promise<void>;

    gerarPDF(relatorio: RelatorioMedico): Promise<string>;
}