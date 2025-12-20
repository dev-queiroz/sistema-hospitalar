import {BaseEntity} from '../../core/model/BaseEntity';
import {NivelGravidade} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';

export class Triagem extends BaseEntity {
    pacienteId: string;
    enfermeiroId: string;
    unidadeSaudeId: string;
    nivelGravidade: NivelGravidade;
    sinaisVitais: SinaisVitais;
    data: Date;
    queixaPrincipal: string;

    constructor(
        id: string,
        pacienteId: string,
        enfermeiroId: string,
        unidadeSaudeId: string,
        nivelGravidade: NivelGravidade,
        sinaisVitais: SinaisVitais,
        queixaPrincipal: string
    ) {
        super(id);
        this.pacienteId = pacienteId;
        this.enfermeiroId = enfermeiroId;
        this.unidadeSaudeId = unidadeSaudeId;
        this.nivelGravidade = nivelGravidade;
        this.sinaisVitais = sinaisVitais;
        this.data = new Date();
        this.queixaPrincipal = queixaPrincipal;
    }
}