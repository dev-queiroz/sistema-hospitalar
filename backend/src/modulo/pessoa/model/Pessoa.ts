export class Pessoa {
    id: string;
    nome: string;
    cpf: string;
    dataNascimento: Date;
    sexo: 'M' | 'F' | 'Outro';
    endereco: string;
    telefone: string;
    email: string;
    cartaoSUS: string;

    constructor(
        id: string,
        nome: string,
        cpf: string,
        dataNascimento: Date,
        sexo: 'M' | 'F' | 'Outro',
        endereco: string,
        telefone: string,
        email: string,
        cartaoSUS: string
    ) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.dataNascimento = dataNascimento;
        this.sexo = sexo;
        this.endereco = endereco;
        this.telefone = telefone;
        this.email = email;
        this.cartaoSUS = cartaoSUS;
    }
}
