import {RelatorioMedico} from '../models/RelatorioMedico';

export interface IRelatorioMedicoRepository {
    findAll(): Promise<RelatorioMedico[]>;

    findById(id: string): Promise<RelatorioMedico | null>;

    findByMedicoId(medicoId: string): Promise<RelatorioMedico[]>;

    insert(relatorio: RelatorioMedico): Promise<RelatorioMedico>;

    update(id: string, relatorio: RelatorioMedico): Promise<RelatorioMedico>;

    delete(id: string): Promise<void>;
}