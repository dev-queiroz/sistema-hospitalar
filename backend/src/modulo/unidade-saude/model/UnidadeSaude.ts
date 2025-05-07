import {BaseEntity} from '../../core/model/BaseEntity';
import {Endereco} from '../../core/model/Interfaces';
import {TipoUnidadeSaude} from '../../core/model/Enums';

export class UnidadeSaude extends BaseEntity {
    nome: string;
    tipo: TipoUnidadeSaude;
    cnes: string; // Código Nacional de Estabelecimento de Saúde
    endereco: Endereco;
    telefone: string;
    servicosEssenciais: string[]; // Ex.: "ATENDIMENTO_BASICO", "TRIAGEM"
    servicosAmpliados: string[]; // Ex.: "CONSULTA_ESPECIALIZADA"

    constructor(
        id: string,
        nome: string,
        tipo: TipoUnidadeSaude,
        cnes: string,
        endereco: Endereco,
        telefone: string,
        servicosEssenciais: string[],
        servicosAmpliados: string[]
    ) {
        super(id);
        this.nome = nome;
        this.tipo = tipo;
        this.cnes = cnes;
        this.endereco = endereco;
        this.telefone = telefone;
        this.servicosEssenciais = servicosEssenciais;
        this.servicosAmpliados = servicosAmpliados;
    }
}