import {Funcionario} from './Funcionario';
import {Paciente} from './Paciente';

export class Enfermeiro extends Funcionario {
    private coren: string;

    constructor(
        id: string,
        userId: string,
        nome: string,
        cpf: string,
        telefone: string,
        email: string,
        cargo: string,
        coren: string
    ) {
        super(id, userId, nome, cpf, telefone, email, cargo);
        this.coren = coren;
    }

    // Getters
    public getCoren(): string {
        return this.coren;
    }

    public assistirPaciente(paciente: Paciente): void {
        if (!this.validarCoren()) {
            throw new Error('COREN inválido. Não é possível assistir paciente.');
        }
        // Simulação de assistência (ex.: atualizar prontuário do paciente)
        const prontuario = paciente.getProntuarios().find(p => p.getUltimaAtualizacao() === null);
        if (prontuario) {
            prontuario.atualizarDados(`Assistência realizada por ${this.nome}`);
        }
    }

    protected validarCoren(): boolean {
        // Simulação de validação (ex.: COREN deve ter 7 dígitos)
        return this.coren.length === 7 && !isNaN(Number(this.coren));
    }
}