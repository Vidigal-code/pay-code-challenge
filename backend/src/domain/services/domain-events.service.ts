export interface DomainEvent<T = any> {
    name: string;
    payload: T;
    timestamp?: string;
}

export interface DomainEventsService {
    publish<T>(event: DomainEvent<T>): Promise<void>;
}

