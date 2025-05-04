export interface PessoaDTO {
    nome: string;
    cpf: string;
    dataNascimento: Date;
    sexo: 'M' | 'F' | 'Outro';
    endereco: string;
    telefone: string;
    email: string;
    cartaoSUS: string;
}
