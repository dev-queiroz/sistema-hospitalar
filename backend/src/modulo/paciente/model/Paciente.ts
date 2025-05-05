import {Endereco} from '../../../shared/types/endereco.ts';

export class Paciente {
    private readonly id?: string;
    protected sus_number: number;
    private rg?: number;
    private cpf: cpf;
    public nome: string;
    public data_nasc: string;
    public endereco: Endereco;
    public telefone: string;
}