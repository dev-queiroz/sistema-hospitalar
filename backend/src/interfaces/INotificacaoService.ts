import {Notificacao} from '../models/Notificacao';

export interface INotificacaoService {
    getAll(): Promise<Notificacao[]>;

    getById(id: string): Promise<Notificacao | null>;

    create(notificacao: Notificacao): Promise<Notificacao>;

    update(id: string, notificacao: Notificacao): Promise<Notificacao>;

    delete(id: string): Promise<void>;

    enviarNotificacao(notificacao: Notificacao): Promise<void>;
}