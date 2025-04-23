import {Paciente} from './Paciente';
import {Medico} from './Medico';
import {Prescricao} from './Prescricao';
import {Exame} from './Exame';

export class Consulta {
    private id: string;
    private paciente: Paciente;
    private medico: Medico;
    private dataHora: Date;
    private diagnostico: string;
    private observacoes: string;
    private status: string;
    private prescricoes: Prescricao[];
    private exames: Exame[];

    constructor(
        id: string,
        paciente: Paciente,
        medico: Medico,
        dataHora: Date,
        diagnostico: string,
        observacoes: string,
        status: string
    ) {
        this.id = id;
        this.paciente = paciente;
        this.medico = medico;
        this.dataHora = dataHora;
        this.diagnostico = diagnostico;
        this.observacoes = observacoes;
        this.status = status;
        this.prescricoes = [];
        this.exames = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getPaciente(): Paciente {
        return this.paciente;
    }

    public getMedico(): Medico {
        return this.medico;
    }

    public getDataHora(): Date {
        return this.dataHora;
    }

    public getDiagnostico(): string {
        return this.diagnostico;
    }

    public getObservacoes(): string {
        return this.observacoes;
    }

    public getStatus(): string {
        return this.status;
    }

    public getPrescricoes(): Prescricao[] {
        return this.prescricoes;
    }

    public getExames(): Exame[] {
        return this.exames;
    }

    public finalizarConsulta(diagnostico: string): void {
        if (!this.validarStatus()) {
            throw new Error('Consulta não pode ser finalizada. Status inválido.');
        }
        this.diagnostico = diagnostico;
        this.status = 'Finalizada';
    }

    public cancelarConsulta(): void {
        if (this.status === 'Finalizada') {
            throw new Error('Consulta já finalizada não pode ser cancelada.');
        }
        this.status = 'Cancelada';
    }

    protected validarStatus(): boolean {
        return this.status === 'Agendada' || this.status === 'Em Andamento';
    }
}