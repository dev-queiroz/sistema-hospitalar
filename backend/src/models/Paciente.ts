import {Consulta} from './Consulta';
import {Internacao} from './Internacao';
import {Prontuario} from './Prontuario';

export class Paciente {
    private id: string;
    private nome: string;
    private cpf: string;
    private dataNasc: Date;
    private telefone: string;
    private endereco: string;
    private historicoMedico: string;
    private classificacaoRisco: string;
    protected senhaAcesso: string;
    private consultas: Consulta[];
    private internacoes: Internacao[];
    private prontuarios: Prontuario[];

    constructor(
        id: string,
        nome: string,
        cpf: string,
        dataNasc: Date,
        telefone: string,
        endereco: string,
        historicoMedico: string,
        classificacaoRisco: string
    ) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.dataNasc = dataNasc;
        this.telefone = telefone;
        this.endereco = endereco;
        this.historicoMedico = historicoMedico;
        this.classificacaoRisco = classificacaoRisco;
        this.senhaAcesso = '';
        this.consultas = [];
        this.internacoes = [];
        this.prontuarios = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getNome(): string {
        return this.nome;
    }

    public getCpf(): string {
        return this.cpf;
    }

    public getDataNasc(): Date {
        return this.dataNasc;
    }

    public getTelefone(): string {
        return this.telefone;
    }

    public getEndereco(): string {
        return this.endereco;
    }

    public getHistoricoMedico(): string {
        return this.historicoMedico;
    }

    public getClassificacaoRisco(): string {
        return this.classificacaoRisco;
    }

    public getConsultas(): Consulta[] {
        return this.consultas;
    }

    public getInternacoes(): Internacao[] {
        return this.internacoes;
    }

    public getProntuarios(): Prontuario[] {
        return this.prontuarios;
    }

    // Setters
    public setClassificacaoRisco(classificacaoRisco: string): void {
        this.classificacaoRisco = classificacaoRisco;
    }

    public atualizarContato(telefone: string, endereco: string): void {
        this.telefone = telefone;
        this.endereco = endereco;
    }

    public redefinirSenha(): void {
        this.senhaAcesso = Math.random().toString(36).slice(-8); // Senha temporária
    }
}