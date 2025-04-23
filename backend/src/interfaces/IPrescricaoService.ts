import {Prescricao} from '../models/Prescricao';

export interface IPrescricaoService {
    getAll(): Promise<Prescricao[]>;

    getById(id: string): Promise<Prescricao | null>;

    create(prescricao: Prescricao): Promise<Prescricao>;

    update(id: string, prescricao: Prescricao): Promise<Prescricao>;

    delete(id: string): Promise<void>;

    gerarQrCode(prescricao: Prescricao): Promise<string>;
}