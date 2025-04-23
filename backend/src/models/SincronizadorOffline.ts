import {UnidadeSaude} from './UnidadeSaude';
import {RedisClient} from './RedisClient';
import {DadoOffline} from './DadoOffline';

export class SincronizadorOffline {
    private id: string;
    protected unidade: UnidadeSaude;
    private redisClient: RedisClient;
    private ultimaSincronizacao: Date | null;
    private dadosPendentes: DadoOffline[];

    constructor(id: string, unidade: UnidadeSaude, redisClient: RedisClient) {
        this.id = id;
        this.unidade = unidade;
        this.redisClient = redisClient;
        this.ultimaSincronizacao = null;
        this.dadosPendentes = [];
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUnidade(): UnidadeSaude {
        return this.unidade;
    }

    public getRedisClient(): RedisClient {
        return this.redisClient;
    }

    public getUltimaSincronizacao(): Date | null {
        return this.ultimaSincronizacao;
    }

    public getDadosPendentes(): DadoOffline[] {
        return this.dadosPendentes;
    }

    public salvarOffline(dado: DadoOffline): void {
        this.dadosPendentes.push(dado);
        this.redisClient.set(dado.getId(), dado.serializar());
    }

    public sincronizarDados(): void {
        if (!this.verificarConexao()) {
            throw new Error('Sem conexão para sincronizar dados.');
        }
        this.dadosPendentes.forEach(dado => {
            // Simulação de sincronização com o backend
            console.log(`Sincronizando dado ${dado.getId()}`);
            this.redisClient.set(dado.getId(), ''); // Limpa o dado do Redis
        });
        this.dadosPendentes = [];
        this.ultimaSincronizacao = new Date();
    }

    public verificarConexao(): boolean {
        // Simulação de verificação de conexão
        return true;
    }

    protected conectarRedis(): void {
        this.redisClient.connect();
    }
}