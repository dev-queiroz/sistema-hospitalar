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

export {
    NivelGravidade,
    TipoUnidadeSaude,
    Papeis
}
