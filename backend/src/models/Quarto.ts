import {UnidadeSaude} from './UnidadeSaude';
import {Leito} from './Leito';

export class Quarto {
    private id: string;
    protected unidade: UnidadeSaude;
    private numero: number;
    private tipo: string;
    private leitos: Leito[];

    constructor(id: string, unidade: UnidadeSaude, numero: number, tipo: string) {
        this.id = id;
        this.unidade = unidade;
        this.numero = numero;
        this.tipo = tipo;
        this.leitos = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUnidade(): UnidadeSaude {
        return this.unidade;
    }

    public getNumero(): number {
        return this.numero;
    }

    public getTipo(): string {
        return this.tipo;
    }

    public getLeitos(): Leito[] {
        return this.leitos;
    }

    public listarLeitos(): Leito[] {
        return this.leitos;
    }
}