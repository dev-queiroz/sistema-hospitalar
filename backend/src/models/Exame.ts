import {Consulta} from './Consulta';

export class Exame {
    private id: string;
    protected consulta: Consulta;
    private tipoExame: string;
    private dataSolicitacao: Date;
    private dataRealizacao: Date | null;
    private resultado: string;
    private status: string;

    constructor(
        id: string,
        consulta: Consulta,
        tipoExame: string,
        dataSolicitacao: Date,
        status: string
    ) {
        this.id = id;
        this.consulta = consulta;
        this.tipoExame = tipoExame;
        this.dataSolicitacao = dataSolicitacao;
        this.dataRealizacao = null;
        this.resultado = '';
        this.status = status;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getConsulta(): Consulta {
        return this.consulta;
    }

    public getTipoExame(): string {
        return this.tipoExame;
    }

    public getDataSolicitacao(): Date {
        return this.dataSolicitacao;
    }

    public getDataRealizacao(): Date | null {
        return this.dataRealizacao;
    }

    public getResultado(): string {
        return this.resultado;
    }

    public getStatus(): string {
        return this.status;
    }

    public atualizarResultados(resultados: string): void {
        if (!this.validarStatus()) {
            throw new Error('Status inválido para atualizar resultados.');
        }
        this.resultado = resultados;
        this.dataRealizacao = new Date();
        this.status = 'Concluído';
    }

    protected validarStatus(): boolean {
        return this.status === 'Solicitado' || this.status === 'Em Andamento';
    }
}