import {Medico} from './Medico';

export class RelatorioMedico {
    private id: string;
    protected medico: Medico;
    private dataGeracao: Date;
    private conteudo: string;

    constructor(id: string, medico: Medico, conteudo: string) {
        this.id = id;
        this.medico = medico;
        this.dataGeracao = new Date();
        this.conteudo = conteudo;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getMedico(): Medico {
        return this.medico;
    }

    public getDataGeracao(): Date {
        return this.dataGeracao;
    }

    public getConteudo(): string {
        return this.conteudo;
    }

    public gerarPDF(): string {
        // Simulação de geração de PDF
        return `PDF_${this.id}.pdf`;
    }

    public consultarRelatorio(): string {
        return this.conteudo;
    }
}