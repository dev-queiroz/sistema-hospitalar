import {BaseEntity} from '../../core/model/BaseEntity';

export class Leito extends BaseEntity {
    numero: string;
    quartoId: string;
    disponivel: boolean;

    constructor(id: string, numero: string, quartoId: string) {
        super(id);
        this.numero = numero;
        this.quartoId = quartoId;
        this.disponivel = true;
    }
}