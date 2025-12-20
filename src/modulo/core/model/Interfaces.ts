interface SinaisVitais {
    pressaoArterialSistolica: number; // mmHg
    pressaoArterialDiastolica: number; // mmHg
    temperatura: number; // °C
    frequenciaCardiaca: number; // bpm
    saturacaoOxigenio: number; // %
    frequenciaRespiratoria: number; // rpm
    nivelDor: number; // 0-10 (escala de dor)
    estadoConsciente: boolean; // true = consciente, false = alterado
}

interface Endereco {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export {
    SinaisVitais,
    Endereco
}