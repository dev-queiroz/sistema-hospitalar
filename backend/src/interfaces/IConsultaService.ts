import {Consulta} from '../models/Consulta';
import {Paciente} from '../models/Paciente';
import {Medico} from '../models/Medico';

export interface IConsultaService {
    criarConsulta(paciente: Paciente, medico: Medico, data: Date): Promise<Consulta>;

    cancelarConsulta(consulta: Consulta): Promise<void>;

    atualizarDiagnostico(consulta: Consulta, diagnostico: string): Promise<void>;

    getAll(): Promise<Consulta[]>;

    getById(id: string): Promise<Consulta | null>;
}