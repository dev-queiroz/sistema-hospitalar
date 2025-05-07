import {Paciente} from '../../paciente/model/Paciente';
import {NivelGravidade} from '../../core/model/Enums';
import {SinaisVitais} from '../../core/model/Interfaces';

export class PrioridadeService {
    static calcularNivelGravidade(paciente: Paciente, sinaisVitais: SinaisVitais, queixaPrincipal: string): NivelGravidade {
        let pontuacao = 0;

        // Idade (MS considera >60 anos ou <5 anos como risco)
        const idade = new Date().getFullYear() - paciente.dataNascimento.getFullYear();
        if (idade > 60 || idade < 5) pontuacao += 30;

        // Grupos de Risco (comorbidades)
        if (paciente.gruposRisco.length > 0) pontuacao += 20 * paciente.gruposRisco.length;

        // Sinais Vitais (conforme normas do MS)
        if (sinaisVitais.pressaoArterialSistolica > 180 || sinaisVitais.pressaoArterialSistolica < 90) pontuacao += 40;
        if (sinaisVitais.pressaoArterialDiastolica > 110 || sinaisVitais.pressaoArterialDiastolica < 60) pontuacao += 30;
        if (sinaisVitais.temperatura > 39 || sinaisVitais.temperatura < 35) pontuacao += 30;
        if (sinaisVitais.frequenciaCardiaca > 120 || sinaisVitais.frequenciaCardiaca < 50) pontuacao += 30;
        if (sinaisVitais.saturacaoOxigenio < 90) pontuacao += 50;
        if (sinaisVitais.frequenciaRespiratoria > 30 || sinaisVitais.frequenciaRespiratoria < 12) pontuacao += 40;
        if (sinaisVitais.nivelDor >= 8) pontuacao += 30;
        if (!sinaisVitais.estadoConsciente) pontuacao += 60;

        // Queixa Principal (exemplos críticos)
        if (queixaPrincipal.toUpperCase().includes("DOR_TORACICA") || queixaPrincipal.toUpperCase().includes("DISPNEIA")) {
            pontuacao += 50;
        }

        // Classificação (baseada em pontuação aproximada)
        if (pontuacao >= 150) return NivelGravidade.Vermelho;
        if (pontuacao >= 100) return NivelGravidade.Laranja;
        if (pontuacao >= 70) return NivelGravidade.Amarelo;
        if (pontuacao >= 40) return NivelGravidade.Verde;
        return NivelGravidade.Azul;
    }
}