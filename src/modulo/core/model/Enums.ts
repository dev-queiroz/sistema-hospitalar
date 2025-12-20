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
    ADMINISTRADOR_PRINCIPAL = "ADMINISTRADOR_PRINCIPAL",
    ENFERMEIRO = "ENFERMEIRO",
    MEDICO = "MEDICO",
}

enum Sexo {
    MASCULINO = "MASCULINO",
    FEMININO = "FEMININO",
    OUTRO = "OUTRO",
}

enum RacaCor {
    BRANCA = "BRANCA",
    PRETA = "PRETA",
    PARDA = "PARDA",
    AMARELA = "AMARELA",
    INDIGENA = "INDIGENA",
    NAO_DECLARADO = "NAO_DECLARADO",
}

enum Escolaridade {
    SEM_ESCOLARIDADE = "SEM_ESCOLARIDADE",
    FUNDAMENTAL = "FUNDAMENTAL",
    MEDIO = "MEDIO",
    SUPERIOR = "SUPERIOR",
    POS_GRADUACAO = "POS_GRADUACAO",
}

export {
    NivelGravidade,
    TipoUnidadeSaude,
    Papeis,
    Sexo,
    RacaCor,
    Escolaridade
}
