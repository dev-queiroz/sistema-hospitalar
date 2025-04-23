import {LogAuditoria} from '../models/LogAuditoria';

export interface ILogAuditoriaRepository {
    findAll(): Promise<LogAuditoria[]>;

    findById(id: string): Promise<LogAuditoria | null>;

    findByUsuarioId(usuarioId: string): Promise<LogAuditoria[]>;

    insert(log: LogAuditoria): Promise<LogAuditoria>;

    update(id: string, log: LogAuditoria): Promise<LogAuditoria>;

    delete(id: string): Promise<void>;
}