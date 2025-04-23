import {Internacao} from '../models/Internacao';
import {Paciente} from '../models/Paciente';
import {Leito} from '../models/Leito';

export interface IInternacaoService {
    registrarInternacao(paciente: Paciente, leito: Leito): Promise<Internacao>;

    registrarAlta(internacao: RosInternacao): Promise<void>;

    transferirPaciente(internacao: Internacao, novoLeito: Leito): Promise<void>;

    getAll(): Promise<Internacao[]>;

    getById(id: string): Promise<Internacao | null>;
}