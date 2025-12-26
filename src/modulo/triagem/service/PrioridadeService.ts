// src/service/PrioridadeService.ts
import { Paciente } from '../../paciente/model/Paciente';
import { NivelGravidade } from '../../core/model/Enums';
import { SinaisVitais } from '../../core/model/Interfaces';
import { differenceInYears } from 'date-fns';

const QUEIXAS_CRITICAS = [
    'DOR TORACICA', 'DISPNEIA', 'PARADA CARDIACA', 'CONVULSAO', 'HEMORRAGIA',
    'PERDA DE CONSCIENCIA', 'TRAUMA GRAVE', 'CHOQUE', 'DIFICULDADE RESPIRATORIA',
    'INFARTO', 'AVC', 'CRISE CONVULSIVA'
];

const QUEIXAS_URGENTES = [
    'DOR ABDOMINAL', 'FEBRE ALTA', 'VOMITO', 'DESMAIO', 'DOR DE CABECA FORTE',
    'TONTURA', 'CONFUSAO MENTAL', 'FRAQUEZA', 'DOR INTENSA'
];

const COMORBIDADES_GRAVES = [
    'DIABETES', 'HIPERTENSAO', 'DOENCA CARDIACA', 'DOENCA PULMONAR',
    'CANCER', 'IMUNOSSUPRESSAO', 'INSUFICIENCIA RENAL'
];

export class PrioridadeService {
    static calcularNivelGravidade(
        paciente: Paciente,
        sinaisVitais: SinaisVitais,
        queixaPrincipal: string
    ): { data: NivelGravidade | null, error: Error | null } {
        try {
            let pontuacao = 0;
            const queixaNormalizada = queixaPrincipal.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // VERMELHO IMEDIATO — condições críticas
            if (QUEIXAS_CRITICAS.some(q => queixaNormalizada.includes(q))) {
                return { data: NivelGravidade.Vermelho, error: null };
            }
            if (!sinaisVitais.estadoConsciente) {
                return { data: NivelGravidade.Vermelho, error: null };
            }
            if (sinaisVitais.saturacaoOxigenio != null && sinaisVitais.saturacaoOxigenio < 88) pontuacao += 80;
            if (sinaisVitais.frequenciaRespiratoria && (sinaisVitais.frequenciaRespiratoria > 32 || sinaisVitais.frequenciaRespiratoria < 8)) pontuacao += 70;
            if (sinaisVitais.pressaoArterialSistolica && sinaisVitais.pressaoArterialSistolica < 80) pontuacao += 70;
            if (sinaisVitais.frequenciaCardiaca && (sinaisVitais.frequenciaCardiaca > 140 || sinaisVitais.frequenciaCardiaca < 40)) pontuacao += 60;

            // LARANJA — condições urgentes
            if (sinaisVitais.nivelDor != null && sinaisVitais.nivelDor >= 8) pontuacao += 50; // dor extrema
            if (sinaisVitais.temperatura && sinaisVitais.temperatura >= 38.5) pontuacao += 40; // febre alta (38.5+)
            if (sinaisVitais.saturacaoOxigenio != null && sinaisVitais.saturacaoOxigenio < 92) pontuacao += 40;
            if (sinaisVitais.frequenciaRespiratoria && sinaisVitais.frequenciaRespiratoria > 24) pontuacao += 35;
            if (QUEIXAS_URGENTES.some(q => queixaNormalizada.includes(q))) pontuacao += 45;

            // AMARELO — risco moderado
            if (sinaisVitais.temperatura && sinaisVitais.temperatura >= 37.8) pontuacao += 20;
            if (sinaisVitais.nivelDor != null && sinaisVitais.nivelDor >= 6) pontuacao += 25;
            if (sinaisVitais.pressaoArterialSistolica && (sinaisVitais.pressaoArterialSistolica > 160 || sinaisVitais.pressaoArterialSistolica < 90)) pontuacao += 25;

            // Fatores de risco do paciente
            const idade = differenceInYears(new Date(), paciente.dataNascimento);
            if (idade < 2 || idade > 75) pontuacao += 40;
            else if (idade < 5 || idade > 65) pontuacao += 25;

            const comorbidades = paciente.gruposRisco?.filter(g =>
                COMORBIDADES_GRAVES.some(c => g.toUpperCase().includes(c))
            ).length || 0;
            pontuacao += comorbidades * 20;

            // Classificação final
            if (pontuacao >= 120) return { data: NivelGravidade.Vermelho, error: null };
            if (pontuacao >= 80) return { data: NivelGravidade.Laranja, error: null };
            if (pontuacao >= 50) return { data: NivelGravidade.Amarelo, error: null };
            if (pontuacao >= 20) return { data: NivelGravidade.Verde, error: null };
            return { data: NivelGravidade.Azul, error: null };

        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error('Erro ao calcular prioridade') };
        }
    }
}