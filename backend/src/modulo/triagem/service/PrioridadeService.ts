import {Paciente} from '../../paciente/model/Paciente';
import {NivelGravidade} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';

export class PrioridadeService {
    static calcularNivelGravidade(paciente: Paciente, sinaisVitais: SinaisVitais, queixaPrincipal: string): NivelGravidade {
        let pontuacao = 0;
        const queixaUpper = queixaPrincipal.toUpperCase();

        // 1. Queixas Críticas (baseado no Protocolo de Manchester)
        const queixasCriticas = [
            'DOR_TORACICA', 'DISPNEIA', 'PARADA_CARDIACA', 'CONVULSAO', 'HEMORRAGIA_GRAVE',
            'PERDA_CONSCIENCIA', 'TRAUMA_GRAVE', 'CHOQUE', 'DIFICULDADE_RESPIRATORIA'
        ];
        if (queixasCriticas.some(q => queixaUpper.includes(q))) {
            return NivelGravidade.Vermelho; // Emergência imediata
        }

        // 2. Sinais Vitais (limites baseados em normas do MS e Manchester)
        if (sinaisVitais.saturacaoOxigenio < 90) pontuacao += 60;
        if (sinaisVitais.frequenciaRespiratoria > 30 || sinaisVitais.frequenciaRespiratoria < 10) pontuacao += 50;
        if (sinaisVitais.pressaoArterialSistolica > 180 || sinaisVitais.pressaoArterialSistolica < 90) pontuacao += 40;
        if (sinaisVitais.pressaoArterialDiastolica > 110 || sinaisVitais.pressaoArterialDiastolica < 60) pontuacao += 30;
        if (sinaisVitais.frequenciaCardiaca > 120 || sinaisVitais.frequenciaCardiaca < 50) pontuacao += 40;
        if (sinaisVitais.temperatura > 39 || sinaisVitais.temperatura < 35) pontuacao += 30;
        if (sinaisVitais.nivelDor >= 8) pontuacao += 30;
        if (!sinaisVitais.estadoConsciente) pontuacao += 70;

        // 3. Idade (risco para idosos e crianças)
        const idade = new Date().getFullYear() - paciente.dataNascimento.getFullYear();
        if (idade > 65 || idade < 5) pontuacao += 30;

        // 4. Grupos de Risco (comorbidades)
        const comorbidadesGraves = ['DIABETES', 'HIPERTENSAO', 'DOENCA_CARDIACA', 'DOENCA_PULMONAR', 'IMUNOSSUPRESSAO'];
        const numComorbidades = paciente.gruposRisco.filter(g => comorbidadesGraves.includes(g.toUpperCase())).length;
        pontuacao += numComorbidades * 20;

        // 5. Queixas Urgentes Moderadas
        const queixasUrgentes = ['DOR_ABDOMINAL', 'FEBRE_ALTA', 'VOMITOS_PERSISTENTES', 'DESMAIO'];
        if (queixasUrgentes.some(q => queixaUpper.includes(q))) {
            pontuacao += 40;
        }

        // 6. Classificação Final
        if (pontuacao >= 150 || !sinaisVitais.estadoConsciente) return NivelGravidade.Vermelho;
        if (pontuacao >= 100) return NivelGravidade.Laranja;
        if (pontuacao >= 60) return NivelGravidade.Amarelo;
        if (pontuacao >= 30) return NivelGravidade.Verde;
        return NivelGravidade.Azul;
    }
}