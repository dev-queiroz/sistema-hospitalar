export class Quarto {
    id: string;
    unidade_saude_id: string;
    numero: string;
    tipo: 'coletivo' | 'isolamento' | 'enfermaria' | 'apartamento';
    created_at?: string;
    updated_at?: string;
}