export interface UnidadeSaude {
    id?: string;
    nome: string;
    tipo: 'UPA' | 'UBS' | 'Hospital' | 'Outro';
    endereco: string;
    contato?: string;
    responsavel_id?: string;
}