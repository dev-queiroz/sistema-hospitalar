import {Notificacao} from '../models/Notificacao';

export interface INotificacaoRepository {
    findAll(): Promise<Notificacao[]>;

    findById(id: string): Promise<Notificacao | null>;

    findByInternacaoId(internacaoId: string): Promise<Notificacao[]>;

    insert(notificacao: Notificacao): Promise<Notificacao>;

    update(id: string, notificacao: Notificacao): Promise<Notificacao>;

    delete(id: string): Promise<void>;
}