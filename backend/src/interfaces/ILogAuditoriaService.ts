import {LogAuditoria} from '../models/LogAuditoria';

export interface ILogAuditoriaService {
    getAll(): Promise<LogAuditoria[]>;

    getById(id: string): Promise<LogAuditoria | null>;

    create(log: LogAuditoria): Promise<LogAuditoria>;

    update(id: string, log: LogAuditoria): Promise<LogAuditoria>;

    delete(id: string): Promise<void>;
}