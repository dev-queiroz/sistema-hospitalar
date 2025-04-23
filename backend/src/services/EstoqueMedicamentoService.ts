import { GenericRepository } from '../models/GenericRepository';
import { EstoqueMedicamento } from '../models/EstoqueMedicamento';
import { Medicamento } from '../models/Medicamento';
import { UnidadeSaude } from '../models/UnidadeSaude';

export class EstoqueService {
    private estoqueRepository: GenericRepository<EstoqueMedicamento>;

    constructor(estoqueRepository: GenericRepository<EstoqueMedicamento>) {
        this.estoqueRepository = estoqueRepository;
    }

    public async adicionarMedicamento(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void> {
        const estoque = unidade.getEstoque().find(e => e.getMedicamento() === medicamento);
        if (estoque) {
            estoque.atualizarEstoque(estoque.getQuantidade() + quantidade, 'Entrada');
            await this.estoqueRepository.update(estoque.getId(), estoque);
        } else {
            throw new Error('Estoque não encontrado para o medicamento.');
        }
    }

    public async retirarMedicamento(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void> {
        const estoque = unidade.getEstoque().find(e => e.getMedicamento() === medicamento);
        if (estoque && this.validarEstoqueDisponivel(medicamento, unidade, quantidade)) {
            estoque.atualizarEstoque(estoque.getQuantidade() - quantidade, 'Saída');
            await this.estoqueRepository.update(estoque.getId(), estoque);
        } else {
            throw new Error('Estoque insuficiente ou não encontrado.');
        }
    }

    public async verificarEstoque(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): Promise<void> {
        if (!this.validarEstoqueDisponivel(medicamento, unidade, quantidade)) {
            throw new Error('Estoque insuficiente.');
        }
    }

    public validarEstoqueDisponivel(medicamento: Medicamento, unidade: UnidadeSaude, quantidade: number): boolean {
        const estoque = unidade.getEstoque().find(e => e.getMedicamento() === medicamento);
        return estoque ? estoque.getQuantidade() >= quantidade : false;
    }
}