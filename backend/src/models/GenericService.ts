import {GenericRepository} from './GenericRepository';

export class GenericService<T> {
    private repository: GenericRepository<T>;

    constructor(repository: GenericRepository<T>) {
        this.repository = repository;
    }

    public async findAll(): Promise<T[]> {
        return await this.repository.findAll();
    }

    public async findById(id: string): Promise<T | null> {
        return await this.repository.findById(id);
    }

    public async save(entity: T): Promise<T> {
        return await this.repository.insert(entity);
    }

    public async update(id: string, entity: T): Promise<T> {
        return await this.repository.update(id, entity);
    }

    public async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}