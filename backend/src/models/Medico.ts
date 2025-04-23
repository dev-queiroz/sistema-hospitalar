import {Funcionario} from './Funcionario';
import {Paciente} from './Paciente';
import {Consulta} from './Consulta';
import {RelatorioMedico} from './RelatorioMedico';

export class Medico extends Funcionario {
    private crm: string;
    private especialidade: string;
    private consultas: Consulta[];
    private relatorios: RelatorioMedico[];

    constructor(
        id: string,
        userId: string,
        nome: string,
        cpf: string,
        telefone: string,
        email: string,
        cargo: string,
        crm: string,
        especialidade: string
    ) {
        super(id, userId, nome, cpf, telefone, email, cargo);
        this.crm = crm;
        this.especialidade = especialidade;
        this.consultas = [];
        this.relatorios = [];
    }

    // Getters
    public getCrm(): string {
        return this.crm;
    }

    public getEspecialidade(): string {
        return this.especialidade;
    }

    public getConsultas(): Consulta[] {
        return this.consultas;
    }

    public getRelatorios(): RelatorioMedico[] {
        return this.relatorios;
    }

    public realizarConsulta(paciente: Paciente, data: Date): Consulta {
        if (!this.validarCRM()) {
            throw new Error('CRM inválido. Não é possível realizar consulta.');
        }
        const consulta = new Consulta(
            `consulta_${Date.now()}`,
            paciente,
            this,
            data,
            '',
            '',
            'Agendada'
        );
        this.consultas.push(consulta);
        paciente.getConsultas().push(consulta);
        return consulta;
    }

    protected validarCRM(): boolean {
        // Simulação de validação (ex.: CRM deve ter 6 dígitos)
        return this.crm.length === 6 && !isNaN(Number(this.crm));
    }
}