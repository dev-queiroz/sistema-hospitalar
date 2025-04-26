export interface IEntity {
    id: string;
}

export interface IRepository<T extends IEntity> {
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    insert(entity: T): Promise<T>;
    update(id: string, entity: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}

export interface IService<T extends IEntity> {
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<T>;
    update(id: string, entity: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}