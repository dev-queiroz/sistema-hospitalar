import {Prescricao} from '../models/Prescricao';

export interface IPrescricaoRepository {
    findAll(): Promise<Prescricao[]>;

    findById(id: string): Promise<Prescricao | null>;

    findByConsultaId(consultaId: string): Promise<Prescricao[]>;

    insert(prescricao: Prescricao): Promise<Prescricao>;

    update(id: string, prescricao: Prescricao): Promise<Prescricao>;

    delete(id: string): Promise<void>;
}