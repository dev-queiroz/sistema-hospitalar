import {Quarto} from './Quarto';

export class Leito {
    private id: string;
    protected quarto: Quarto;
    private numeroLeito: number;
    private disponibilidade: string;

    constructor(id: string, quarto: Quarto, numeroLeito: number, disponibilidade: string) {
        this.id = id;
        this.quarto = quarto;
        this.numeroLeito = numeroLeito;
        this.disponibilidade = disponibilidade;
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getQuarto(): Quarto {
        return this.quarto;
    }

    public getNumeroLeito(): number {
        return this.numeroLeito;
    }

    public getDisponibilidade(): string {
        return this.disponibilidade;
    }

    public atualizarDisponibilidade(status: string): void {
        const validStatuses = ['Disponível', 'Ocupado'];
        if (!validStatuses.includes(status)) {
            throw new Error('Status de disponibilidade inválido.');
        }
        this.disponibilidade = status;
    }

    protected verificarOcupacao(): boolean {
        return this.disponibilidade === 'Ocupado';
    }
}