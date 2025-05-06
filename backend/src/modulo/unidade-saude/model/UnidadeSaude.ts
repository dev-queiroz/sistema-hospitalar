import {TipoUnidadeSaude} from "../../../shared/types/types";

class UnidadeSaude extends BaseEntity {
    nome: string;
    tipo: TipoUnidadeSaude;
    cnes: string; // Código SUS
    endereco: string;
    quartos: Quarto[] = [];
    estoqueMedicamentos: EstoqueMedicamento[] = [];

    constructor(id: string, nome: string, tipo: TipoUnidadeSaude, cnes: string, endereco: string) {
        super(id);
        this.nome = nome;
        this.tipo = tipo;
        this.cnes = cnes;
        this.endereco = endereco;
    }
}