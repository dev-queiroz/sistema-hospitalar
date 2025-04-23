export class RedisClient {
    private host: string;
    private port: number;
    private connection: any;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.connection = null;
    }

    public connect(): void {
        // Simulação de conexão
        this.connection = `Connected to ${this.host}:${this.port}`;
        console.log(this.connection);
    }

    public set(key: string, value: string): void {
        if (!this.connection) {
            throw new Error('Redis não está conectado.');
        }
        console.log(`Set ${key}: ${value}`);
    }

    public get(key: string): string {
        if (!this.connection) {
            throw new Error('Redis não está conectado.');
        }
        return `Value for ${key}`;
    }

    protected close(): void {
        this.connection = null;
        console.log('Redis connection closed');
    }
}