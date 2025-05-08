enum NivelGravidade {
    Vermelho = "VERMELHO", // Emergência, imediato
    Laranja = "LARANJA",   // Muito urgente, até 10 min
    Amarelo = "AMARELO",   // Urgente, até 60 min
    Verde = "VERDE",       // Pouco urgente, até 120 min
    Azul = "AZUL",         // Não urgente, até 240 min
}

enum TipoUnidadeSaude {
    Hospital = "HOSPITAL",
    UPA = "UPA",
    UBS = "UBS",
}

enum Papeis {
    ADMINISTRADOR_PRINCIPAL = "ADMINISTRADOR_PRINCIPAL", // Gerencia unidades, quartos, leitos, funcionários
    ENFERMEIRO = "ENFERMEIRO",                           // Triagem, cadastro, atendimento em UPAs
    MEDICO = "MEDICO",                                   // Consultas, prescrições
}

enum Sexo {
    Masculino = "MASCULINO",
    Feminino = "FEMININO",
    Outro = "OUTRO",
}

enum RacaCor {
    Branca = "BRANCA",
    Preta = "PRETA",
    Parda = "PARDA",
    Amarela = "AMARELA",
    Indigena = "INDIGENA",
    NaoDeclarado = "NAO_DECLARADO",
}

enum Escolaridade {
    SemEscolaridade = "SEM_ESCOLARIDADE",
    Fundamental = "FUNDAMENTAL",
    Medio = "MEDIO",
    Superior = "SUPERIOR",
    PosGraduacao = "POS_GRADUACAO",
}

export {
    NivelGravidade,
    TipoUnidadeSaude,
    Papeis,
    Sexo,
    RacaCor,
    Escolaridade
}
