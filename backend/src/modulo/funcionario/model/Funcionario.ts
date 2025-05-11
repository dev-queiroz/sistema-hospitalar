import {Paciente} from '../../paciente/model/Paciente';
import {Escolaridade, Papeis, RacaCor, Sexo} from '../../core/model/Enums';
import {Endereco} from '../../core/model/Interfaces';

/**
 * Representa um funcionário (médico ou enfermeiro) no sistema.
 * Herda de Paciente para reutilizar atributos comuns, mas é usado exclusivamente para papéis profissionais.
 */
export abstract class Funcionario extends Paciente {
    papel: Papeis;
    dataContratacao: Date;
    registroProfissional: string; // Ex.: CRM para médicos, COREN para enfermeiros

    constructor(
        id: string,
        nome: string,
        cpf: string,
        cns: string,
        dataNascimento: Date,
        sexo: Sexo,
        racaCor: RacaCor,
        escolaridade: Escolaridade,
        endereco: Endereco,
        telefone: string,
        gruposRisco: string[],
        consentimentoLGPD: boolean,
        papel: Papeis,
        dataContratacao: Date,
        registroProfissional: string,
        email?: string
    ) {
        super(
            id,
            nome,
            cpf,
            cns,
            dataNascimento,
            sexo,
            racaCor,
            escolaridade,
            endereco,
            telefone,
            gruposRisco,
            consentimentoLGPD,
            email
        );
        if (!['MEDICO', 'ENFERMEIRO', 'ADMINISTRADOR_PRINCIPAL'].includes(papel)) {
            throw new Error('Papel inválido para funcionário');
        }
        this.papel = papel;
        this.dataContratacao = dataContratacao;
        this.registroProfissional = registroProfissional;
    }
}