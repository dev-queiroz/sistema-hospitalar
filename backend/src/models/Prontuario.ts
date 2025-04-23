import {Paciente} from './Paciente';

export class Prontuario {
    private id: string;
    private paciente: Paciente;
    private dadosMedicos: string;
    private ultimaAtualizacao: Date | null;

    constructor(id: string, paciente: Paciente, dadosMedicos: string) {
        this.id = id;
        this.paciente = paciente;
        this.dadosMedicos = dadosMedicos;
        this.ultimaAtualizacao = null;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getPaciente(): Paciente {
        return this.paciente;
    }

    public getDadosMedicos(): string {
        return this.dadosMedicos;
    }

    public getUltimaAtualizacao(): Date | null {
        return this.ultimaAtualizacao;
    }

    public atualizarDados(dados: string): void {
        this.dadosMedicos = dados;
        this.registrarAtualizacao();
    }

    public consultarHistorico(): string {
        return this.dadosMedicos;
    }

    public registrarAtualizacao(): void {
        this.ultimaAtualizacao = new Date();
    }
}