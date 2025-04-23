import {Prescricao} from './Prescricao';
import {Medicamento} from './Medicamento';

export class ItemPrescricao {
    private id: string;
    protected prescricao: Prescricao;
    private medicamento: Medicamento;
    private dosagem: string;
    private instrucoes: string;

    constructor(
        id: string,
        prescricao: Prescricao,
        medicamento: Medicamento,
        dosagem: string,
        instrucoes: string
    ) {
        this.id = id;
        this.prescricao = prescricao;
        this.medicamento = medicamento;
        this.dosagem = dosagem;
        this.instrucoes = instrucoes;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getPrescricao(): Prescricao {
        return this.prescricao;
    }

    public getMedicamento(): Medicamento {
        return this.medicamento;
    }

    public getDosagem(): string {
        return this.dosagem;
    }

    public getInstrucoes(): string {
        return this.instrucoes;
    }

    public getDetalhes(): { [key: string]: any } {
        return {
            id: this.id,
            medicamento: this.medicamento.getNome(),
            dosagem: this.dosagem,
            instrucoes: this.instrucoes
        };
    }
}