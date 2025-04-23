import {Paciente} from './Paciente';
import {Leito} from './Leito';
import {Notificacao} from './Notificacao';

export class Internacao {
    private id: string;
    private paciente: Paciente;
    private leito: Leito;
    private dataEntrada: Date;
    private dataAlta: Date | null;
    private status: string;
    private notificacoes: Notificacao[];

    constructor(id: string, paciente: Paciente, leito: Leito) {
        this.id = id;
        this.paciente = paciente;
        this.leito = leito;
        this.dataEntrada = new Date();
        this.dataAlta = null;
        this.status = 'Ativa';
        this.notificacoes = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getPaciente(): Paciente {
        return this.paciente;
    }

    public getLeito(): Leito {
        return this.leito;
    }

    public getDataEntrada(): Date {
        return this.dataEntrada;
    }

    public getDataAlta(): Date | null {
        return this.dataAlta;
    }

    public getStatus(): string {
        return this.status;
    }

    public getNotificacoes(): Notificacao[] {
        return this.notificacoes;
    }

    public finalizarInternacao(): void {
        if (this.status !== 'Ativa') {
            throw new Error('Internação não está ativa.');
        }
        this.status = 'Finalizada';
        this.dataAlta = new Date();
        this.leito.atualizarDisponibilidade('Disponível');
    }

    public transferirLeito(novoLeito: Leito): void {
        if (this.status !== 'Ativa') {
            throw new Error('Internação não está ativa.');
        }
        this.leito.atualizarDisponibilidade('Disponível');
        this.leito = novoLeito;
        novoLeito.atualizarDisponibilidade('Ocupado');
    }

    public calcularDiasInternados(): number {
        const fim = this.dataAlta || new Date();
        const diffTime = Math.abs(fim.getTime() - this.dataEntrada.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}