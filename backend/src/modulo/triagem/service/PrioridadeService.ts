import {Paciente} from '../../paciente/model/Paciente';
import {NivelGravidade} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';
import {differenceInYears} from 'date-fns';

const QUEIXAS_CRITICAS = [
    'DOR TORÁCICA', 'DISPNEIA', 'PARADA CARDÍACA', 'CONVULSÃO', 'HEMORRAGIA GRAVE',
    'PERDA DE CONSCIÊNCIA', 'TRAUMA GRAVE', 'CHOQUE', 'DIFICULDADE RESPIRATÓRIA'
];

const QUEIXAS_URGENTES = [
    'DOR ABDOMINAL', 'FEBRE ALTA', 'VÔMITOS PERSISTENTES', 'DESMAIO'
];

const COMORBIDADES_GRAVES = [
    'DIABETES', 'HIPERTENSÃO', 'DOENÇA CARDÍACA', 'DOENÇA PULMONAR', 'IMUNOSSUPRESSÃO'
];

export class PrioridadeService {
    static calcularNivelGravidade(
        paciente: Paciente,
        sinaisVitais: SinaisVitais,
        queixaPrincipal: string
    ): { data: NivelGravidade | null, error: Error | null } {
        try {
            // Validações básicas dos sinais vitais
            if (sinaisVitais.saturacaoOxigenio && (sinaisVitais.saturacaoOxigenio < 0 || sinaisVitais.saturacaoOxigenio > 100)) {
                throw new Error('Saturação de oxigênio inválida (0-100%)');
            }
            if (sinaisVitais.frequenciaRespiratoria && (sinaisVitais.frequenciaRespiratoria < 0 || sinaisVitais.frequenciaRespiratoria > 60)) {
                throw new Error('Frequência respiratória inválida (0-60/min)');
            }
            if (sinaisVitais.pressaoArterialSistolica && (sinaisVitais.pressaoArterialSistolica < 0 || sinaisVitais.pressaoArterialSistolica > 300)) {
                throw new Error('Pressão arterial sistólica inválida (0-300 mmHg)');
            }
            if (sinaisVitais.pressaoArterialDiastolica && (sinaisVitais.pressaoArterialDiastolica < 0 || sinaisVitais.pressaoArterialDiastolica > 200)) {
                throw new Error('Pressão arterial diastólica inválida (0-200 mmHg)');
            }
            if (sinaisVitais.frequenciaCardiaca && (sinaisVitais.frequenciaCardiaca < 0 || sinaisVitais.frequenciaCardiaca > 200)) {
                throw new Error('Frequência cardíaca inválida (0-200 bpm)');
            }
            if (sinaisVitais.temperatura && (sinaisVitais.temperatura < 32 || sinaisVitais.temperatura > 43)) {
                throw new Error('Temperatura inválida (32-43°C)');
            }
            if (sinaisVitais.nivelDor && (sinaisVitais.nivelDor < 0 || sinaisVitais.nivelDor > 10)) {
                throw new Error('Nível de dor inválido (0-10)');
            }

            let pontuacao = 0;
            const queixaNormalizada = queixaPrincipal.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // 1. Queixas críticas
            if (QUEIXAS_CRITICAS.some(q => queixaNormalizada.includes(q))) {
                return {data: NivelGravidade.Vermelho, error: null};
            }

            // 2. Sinais vitais
            if (sinaisVitais.saturacaoOxigenio && sinaisVitais.saturacaoOxigenio < 90) pontuacao += 50;
            if (sinaisVitais.frequenciaRespiratoria && (sinaisVitais.frequenciaRespiratoria > 30 || sinaisVitais.frequenciaRespiratoria < 10)) pontuacao += 40;
            if (sinaisVitais.pressaoArterialSistolica && (sinaisVitais.pressaoArterialSistolica > 180 || sinaisVitais.pressaoArterialSistolica < 90)) pontuacao += 30;
            if (sinaisVitais.pressaoArterialDiastolica && (sinaisVitais.pressaoArterialDiastolica > 110 || sinaisVitais.pressaoArterialDiastolica < 60)) pontuacao += 20;
            if (sinaisVitais.frequenciaCardiaca && (sinaisVitais.frequenciaCardiaca > 120 || sinaisVitais.frequenciaCardiaca < 50)) pontuacao += 30;
            if (sinaisVitais.temperatura && (sinaisVitais.temperatura > 39 || sinaisVitais.temperatura < 35)) pontuacao += 20;
            if (sinaisVitais.nivelDor && sinaisVitais.nivelDor >= 8) pontuacao += 25;
            if (!sinaisVitais.estadoConsciente) pontuacao += 100;

            // 3. Idade
            const idade = differenceInYears(new Date(), paciente.dataNascimento);
            if (idade > 65 || idade < 5) pontuacao += 20;

            // 4. Grupos de risco
            const numComorbidades = paciente.gruposRisco
                ? paciente.gruposRisco.filter(g => COMORBIDADES_GRAVES.includes(g.toUpperCase())).length
                : 0;
            pontuacao += Math.min(numComorbidades * 10, 30); // limite de 30 pts

            // 5. Queixas urgentes moderadas
            if (QUEIXAS_URGENTES.some(q => queixaNormalizada.includes(q))) {
                pontuacao += 30;
            }

            // 6. Classificação final refinada
            if (pontuacao >= 160 || !sinaisVitais.estadoConsciente) {
                return {data: NivelGravidade.Vermelho, error: null};
            }
            if (pontuacao >= 110) {
                return {data: NivelGravidade.Laranja, error: null};
            }
            if (pontuacao >= 70) {
                return {data: NivelGravidade.Amarelo, error: null};
            }
            if (pontuacao >= 35) {
                return {data: NivelGravidade.Verde, error: null};
            }

            // Detecção refinada para Azul
            if (pontuacao < 35 && sinaisVitais.nivelDor <= 1 && sinaisVitais.estadoConsciente && queixaNormalizada.length < 10) {
                return {data: NivelGravidade.Azul, error: null};
            }

            // Caso base: Verde, se pontuação baixa mas sem critérios para Azul
            return {data: NivelGravidade.Verde, error: null};
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erro desconhecido')
            };
        }
    }
}
