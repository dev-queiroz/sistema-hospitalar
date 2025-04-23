import { GenericRepository } from '../models/GenericRepository';
import { Internacao } from '../models/Internacao';
import { Paciente } from '../models/Paciente';
import { Leito } from '../models/Leito';

export class InternacaoService {
    private internacaoRepository: GenericRepository<Internacao>;

    constructor(internacaoRepository: GenericRepository<Internacao>) {
        this.internacaoRepository = internacaoRepository;
    }

    public async registrarInternacao(paciente: Paciente, leito: Leito): Promise<Internacao> {
        if (!this.verificarDisponibilidadeLeito(leito)) {
            throw new Error('Leito indisponível.');
        }
        const internacao = new Internacao(`internacao_${Date.now()}`, paciente, leito);
        return await this.internacaoRepository.insert(internacao);
    }

    public async registrarAlta(internacao: Internacao): Promise<void> {
        internacao.finalizarInternacao();
        await this.internacaoRepository.update(internacao.getId(), internacao);
    }

    public async transferirPaciente(internacao: Internacao, novoLeito: Leito): Promise<void> {
        if (!this.verificarDisponibilidadeLeito(novoLeito)) {
            throw new Error('Novo leito indisponível.');
        }
        internacao.transferirLeito(novoLeito);
        await this.internacaoRepository.update(internacao.getId(), internacao);
    }

    public verificarDisponibilidadeLeito(leito: Leito): boolean {
        return leito.getDisponibilidade() === 'Disponível';
    }
}