import {Funcionario} from './Funcionario';
import {Quarto} from './Quarto';
import {EstoqueMedicamento} from './EstoqueMedicamento';

export class UnidadeSaude {
    private id: string;
    private nome: string;
    private tipo: string;
    private endereco: string;
    private telefone: string;
    private capacidadeLeitos: number;
    private funcionarios: Funcionario[];
    private quartos: Quarto[];
    private estoque: EstoqueMedicamento[];

    constructor(id: string, nome: string, tipo: string, endereco: string, telefone: string, capacidadeLeitos: number) {
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.endereco = endereco;
        this.telefone = telefone;
        this.capacidadeLeitos = capacidadeLeitos;
        this.funcionarios = [];
        this.quartos = [];
        this.estoque = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getNome(): string {
        return this.nome;
    }

    public getTipo(): string {
        return this.tipo;
    }

    public getEndereco(): string {
        return this.endereco;
    }

    public getTelefone(): string {
        return this.telefone;
    }

    public getCapacidadeLeitos(): number {
        return this.capacidadeLeitos;
    }

    public getFuncionarios(): Funcionario[] {
        return this.funcionarios;
    }

    public getQuartos(): Quarto[] {
        return this.quartos;
    }

    public getEstoque(): EstoqueMedicamento[] {
        return this.estoque;
    }

    public getInfo(): string {
        return `Unidade de Saúde: ${this.nome}, Tipo: ${this.tipo}, Endereço: ${this.endereco}`;
    }

    public listarFuncionarios(): Funcionario[] {
        return this.funcionarios;
    }

    public listarQuartos(): Quarto[] {
        return this.quartos;
    }
}