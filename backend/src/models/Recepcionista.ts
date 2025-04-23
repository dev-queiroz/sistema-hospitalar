import {Funcionario} from './Funcionario';
import {Paciente} from './Paciente';

export class Recepcionista extends Funcionario {
    private triagens: { pacienteId: string, classificacaoRisco: string, data: Date }[];

    constructor(
        id: string,
        userId: string,
        nome: string,
        cpf: string,
        telefone: string,
        email: string,
        cargo: string
    ) {
        super(id, userId, nome, cpf, telefone, email, cargo);
        this.triagens = [];
    }

    // Getters
    public getTriagens(): { pacienteId: string, classificacaoRisco: string, data: Date }[] {
        return this.triagens;
    }

    // Metodo para realizar triagem
    public realizarTriagem(paciente: Paciente, classificacaoRisco: string): void {
        const validClassificacoes = ['Baixo', 'Médio', 'Alto'];
        if (!validClassificacoes.includes(classificacaoRisco)) {
            throw new Error('Classificação de risco inválida. Use: Baixo, Médio ou Alto.');
        }
        paciente.setClassificacaoRisco(classificacaoRisco);
        this.triagens.push({
            pacienteId: paciente.getId(),
            classificacaoRisco,
            data: new Date()
        });
    }
}