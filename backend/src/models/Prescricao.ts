import {Consulta} from './Consulta';
import {ItemPrescricao} from './ItemPrescricao';

export class Prescricao {
    private id: string;
    protected consulta: Consulta;
    private qrCode: string;
    private status: string;
    private itens: ItemPrescricao[];

    constructor(id: string, consulta: Consulta, status: string) {
        this.id = id;
        this.consulta = consulta;
        this.qrCode = '';
        this.status = status;
        this.itens = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getConsulta(): Consulta {
        return this.consulta;
    }

    public getQrCode(): string {
        return this.qrCode;
    }

    public getStatus(): string {
        return this.status;
    }

    public getItens(): ItemPrescricao[] {
        return this.itens;
    }

    public gerarQrCode(): string {
        this.qrCode = this.criptografarQrCode();
        return this.qrCode;
    }

    public validarQrCode(qrCode: string): boolean {
        return this.qrCode === qrCode;
    }

    protected criptografarQrCode(): string {
        // Simulação de criptografia (ex.: hash simples)
        return `qr_${this.id}_${Date.now()}`;
    }
}