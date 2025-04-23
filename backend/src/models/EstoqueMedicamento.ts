import {UnidadeSaude} from './UnidadeSaude';
import {Medicamento} from './Medicamento';
import {Farmaceutico} from './Farmaceutico';

export class EstoqueMedicamento {
    private id: string;
    protected unidade: UnidadeSaude;
    private medicamento: Medicamento;
    private tipoMovimento: string;
    private quantidade: number;
    private dataMovimento: Date;
    private farmaceutico: Farmaceutico;

    constructor(
        id: string,
        unidade: UnidadeSaude,
        medicamento: Medicamento,
        tipoMovimento: string,
        quantidade: number,
        farmaceutico: Farmaceutico
    ) {
        this.id = id;
        this.unidade = unidade;
        this.medicamento = medicamento;
        this.tipoMovimento = tipoMovimento;
        this.quantidade = quantidade;
        this.dataMovimento = new Date();
        this.farmaceutico = farmaceutico;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUnidade(): UnidadeSaude {
        return this.unidade;
    }

    public getMedicamento(): Medicamento {
        return this.medicamento;
    }

    public getTipoMovimento(): string {
        return this.tipoMovimento;
    }

    public getQuantidade(): number {
        return this.quantidade;
    }

    public getDataMovimento(): Date {
        return this.dataMovimento;
    }

    public getFarmaceutico(): Farmaceutico {
        return this.farmaceutico;
    }

    public atualizarEstoque(quantidade: number, tipoMovimento: string): void {
        if (!this.validarMovimentacao()) {
            throw new Error('Movimentação inválida.');
        }
        this.quantidade = quantidade;
        this.tipoMovimento = tipoMovimento;
        this.dataMovimento = new Date();
    }

    public validarMovimentacao(): boolean {
        return this.quantidade >= 0;
    }

    public gerarRelatoriosEstoque(unidade: UnidadeSaude): void {
        console.log(`Relatório de Estoque - Unidade: ${unidade.getNome()}`);
        console.log(`Medicamento: ${this.medicamento.getNome()}, Quantidade: ${this.quantidade}`);
    }
}