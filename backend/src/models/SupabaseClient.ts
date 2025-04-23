export class SupabaseClient {
    private url: string;
    private apiKey: string;
    private client: any;

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
        this.client = null;
    }

    public query(table: string, conditions: { [key: string]: any }): { [key: string]: any } {
        this.connect();
        return {table, conditions};
    }

    public insert(table: string, data: { [key: string]: any }): void {
        this.connect();
        console.log(`Insert into ${table}:`, data);
    }

    public update(table: string, data: { [key: string]: any }, conditions: { [key: string]: any }): void {
        this.connect();
        console.log(`Update ${table} where`, conditions, 'with', data);
    }

    protected connect(): void {
        if (!this.client) {
            this.client = `Connected to ${this.url}`;
            console.log(this.client);
        }
    }
}