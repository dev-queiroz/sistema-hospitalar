import {GenericService} from './GenericService';

export class GenericController<T> {
    private service: GenericService<T>;

    constructor(service: GenericService<T>) {
        this.service = service;
    }

    public async getAll(): Promise<T[]> {
        return await this.service.findAll();
    }

    public async getById(id: string): Promise<T | null> {
        return await this.service.findById(id);
    }

    public async create(entity: T): Promise<T> {
        return await this.service.save(entity);
    }

    public async update(id: string, entity: T): Promise<T> {
        return await this.service.update(id, entity);
    }

    public async delete(id: string): Promise<void> {
        await this.service.delete(id);
    }
}