import {GenericRepository} from '../models/GenericRepository';
import {Consulta} from '../models/Consulta';
import {Paciente} from '../models/Paciente';
import {Medico} from '../models/Medico';

export class ConsultaService {
    private consultaRepository: GenericRepository<Consulta>;

    constructor(consultaRepository: GenericRepository<Consulta>) {
        this.consultaRepository = consultaRepository;
    }

    public async criarConsulta(paciente: Paciente, medico: Medico, data: Date): Promise<Consulta> {
        if (!this.validarHorario(data)) {
            throw new Error('Horário inválido para consulta.');
        }
        const consulta = new Consulta(
            `consulta_${Date.now()}`,
            paciente,
            medico,
            data,
            '',
            '',
            'Agendada'
        );
        return await this.consultaRepository.insert(consulta);
    }

    public async cancelarConsulta(consulta: Consulta): Promise<void> {
        consulta.cancelarConsulta();
        await this.consultaRepository.update(consulta.getId(), consulta);
    }

    public async atualizarDiagnostico(consulta: Consulta, diagnostico: string): Promise<void> {
        consulta.finalizarConsulta(diagnostico);
        await this.consultaRepository.update(consulta.getId(), consulta);
    }

    public validarHorario(data: Date): boolean {
        return data > new Date();
    }
}