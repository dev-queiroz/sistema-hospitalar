import {UnidadeSaude} from './UnidadeSaude';
import {LogAuditoria} from './LogAuditoria';

export class Funcionario {
    protected id: string;
    protected userId: string;
    protected nome: string;
    protected cpf: string;
    protected telefone: string;
    protected email: string;
    protected cargo: string;
    protected unidadeSaude: UnidadeSaude | null;
    protected senha: string;
    protected logs: LogAuditoria[];

    constructor(id: string, userId: string, nome: string, cpf: string, telefone: string, email: string, cargo: string) {
        this.id = id;
        this.userId = userId;
        this.nome = nome;
        this.cpf = cpf;
        this.telefone = telefone;
        this.email = email;
        this.cargo = cargo;
        this.unidadeSaude = null;
        this.senha = '';
        this.logs = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getNome(): string {
        return this.nome;
    }

    public getCpf(): string {
        return this.cpf;
    }

    public getTelefone(): string {
        return this.telefone;
    }

    public getEmail(): string {
        return this.email;
    }

    public getCargo(): string {
        return this.cargo;
    }

    public getUnidadeSaude(): UnidadeSaude | null {
        return this.unidadeSaude;
    }

    public getLogs(): LogAuditoria[] {
        return this.logs;
    }

    // Setters
    public setUnidadeSaude(unidadeSaude: UnidadeSaude): void {
        this.unidadeSaude = unidadeSaude;
    }

    public setSenha(senha: string): void {
        this.senha = senha;
    }

    public getDados(): string {
        return `Funcionário: ${this.nome}, Cargo: ${this.cargo}, CPF: ${this.cpf}`;
    }

    public atualizarContato(telefone: string, email: string): void {
        this.telefone = telefone;
        this.email = email;
    }

    protected redefinirSenha(): void {
        this.senha = Math.random().toString(36).slice(-8); // Senha temporária
    }
}