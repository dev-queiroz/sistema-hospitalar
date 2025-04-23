import {UnidadeSaude} from './UnidadeSaude';

export class ConfiguracaoRede {
    private id: string;
    protected unidade: UnidadeSaude;
    private vpnServerIp: string;
    private vpnPort: number;
    private vpnCertificado: string;
    private statusConexao: string;

    constructor(id: string, unidade: UnidadeSaude, vpnServerIp: string, vpnPort: number, vpnCertificado: string) {
        this.id = id;
        this.unidade = unidade;
        this.vpnServerIp = vpnServerIp;
        this.vpnPort = vpnPort;
        this.vpnCertificado = vpnCertificado;
        this.statusConexao = 'Desconectado';
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUnidade(): UnidadeSaude {
        return this.unidade;
    }

    public getVpnServerIp(): string {
        return this.vpnServerIp;
    }

    public getVpnPort(): number {
        return this.vpnPort;
    }

    public getVpnCertificado(): string {
        return this.vpnCertificado;
    }

    public getStatusConexao(): string {
        return this.statusConexao;
    }

    public configurarVPN(ip: string, port: number): void {
        this.vpnServerIp = ip;
        this.vpnPort = port;
        this.atualizarStatus('Conectado');
    }

    public verificarConexao(): boolean {
        return this.statusConexao === 'Conectado';
    }

    public atualizarStatus(status: string): void {
        this.statusConexao = status;
    }
}