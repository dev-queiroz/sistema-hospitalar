import {SupabaseClient} from './SupabaseClient';

export class GenericRepository<T> {
    private supabaseClient: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    public async findAll(): Promise<T[]> {
        return [];
    }

    public async findById(id: string): Promise<T | null> {
        return null;
    }

    public async insert(entity: T): Promise<T> {
        return entity;
    }

    public async update(id: string, entity: T): Promise<T> {
        return entity;
    }

    public async delete(id: string): Promise<void> {
        // Simulação de deleção
    }
}