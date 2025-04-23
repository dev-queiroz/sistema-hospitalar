import {SincronizadorOffline} from './SincronizadorOffline';

export class DadoOffline {
    private id: string;
    protected sincronizador: SincronizadorOffline;
    private tipoDados: string;
    private conteudo: { [key: string]: any };
    private dataCriacao: Date;

    constructor(id: string, sincronizador: SincronizadorOffline, tipoDados: string, conteudo: { [key: string]: any }) {
        this.id = id;
        this.sincronizador = sincronizador;
        this.tipoDados = tipoDados;
        this.conteudo = conteudo;
        this.dataCriacao = new Date();
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getSincronizador(): SincronizadorOffline {
        return this.sincronizador;
    }

    public getTipoDados(): string {
        return this.tipoDados;
    }

    public getConteudo(): { [key: string]: any } {
        return this.conteudo;
    }

    public getDataCriacao(): Date {
        return this.dataCriacao;
    }

    public serializar(): string {
        return JSON.stringify({
            id: this.id,
            tipoDados: this.tipoDados,
            conteudo: this.conteudo,
            dataCriacao: this.dataCriacao.toISOString()
        });
    }

    public desserializar(dados: string): void {
        const parsed = JSON.parse(dados);
        this.id = parsed.id;
        this.tipoDados = parsed.tipoDados;
        this.conteudo = parsed.conteudo;
        this.dataCriacao = new Date(parsed.dataCriacao);
    }
}