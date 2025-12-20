export abstract class BaseEntity {
    id: string;
    createdAt: Date;

    protected constructor(id: string) {
        this.id = id;
        this.createdAt = new Date();
    }
}