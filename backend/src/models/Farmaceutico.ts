import {Funcionario} from './Funcionario';
import {Paciente} from './Paciente';
import {Medicamento} from './Medicamento';
import {EstoqueMedicamento} from './EstoqueMedicamento';

export class Farmaceutico extends Funcionario {
    private crf: string;
    private estoques: EstoqueMedicamento[];

    constructor(
        id: string,
        userId: string,
        nome: string,
        cpf: string,
        telefone: string,
        email: string,
        cargo: string,
        crf: string
    ) {
        super(id, userId, nome, cpf, telefone, email, cargo);
        this.crf = crf;
        this.estoques = [];
    }

    // Getters
    public getCrf(): string {
        return this.crf;
    }

    public getEstoques(): EstoqueMedicamento[] {
        return this.estoques;
    }

    public dispensarMedicamento(paciente: Paciente, medicamento: Medicamento): void {
        if (!this.validarCRF()) {
            throw new Error('CRF inválido. Não é possível dispensar medicamento.');
        }
        const estoque = this.estoques.find(e => e.getMedicamento() === medicamento);
        if (estoque && estoque.getQuantidade() > 0) {
            estoque.atualizarEstoque(estoque.getQuantidade() - 1, 'Saída');
        } else {
            throw new Error('Medicamento indisponível no estoque.');
        }
    }

    protected validarCRF(): boolean {
        // Simulação de validação (ex.: CRF deve ter 6 dígitos)
        return this.crf.length === 6 && !isNaN(Number(this.crf));
    }
}