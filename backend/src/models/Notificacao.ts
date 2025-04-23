import {Internacao} from './Internacao';
import {Funcionario} from './Funcionario';

export class Notificacao {
    private id: string;
    private internacao: Internacao;
    private mensagem: string;
    private dataEnvio: Date;
    protected destinatario: Funcionario;

    constructor(id: string, internacao: Internacao, mensagem: string, destinatario: Funcionario) {
        this.id = id;
        this.internacao = internacao;
        this.mensagem = mensagem;
        this.dataEnvio = new Date();
        this.destinatario = destinatario;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getInternacao(): Internacao {
        return this.internacao;
    }

    public getMensagem(): string {
        return this.mensagem;
    }

    public getDataEnvio(): Date {
        return this.dataEnvio;
    }

    public getDestinatario(): Funcionario {
        return this.destinatario;
    }

    public enviarNotificacao(): void {
        // Simulação de envio
        console.log(`Notificação enviada para ${this.destinatario.getNome()}: ${this.formatarMensagem()}`);
    }

    protected formatarMensagem(): string {
        return `[${this.dataEnvio.toISOString()}] ${this.mensagem}`;
    }
}