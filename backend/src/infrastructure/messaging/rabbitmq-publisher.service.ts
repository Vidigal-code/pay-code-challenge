import {Injectable, Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {RabbitMQService} from "./rabbitmq.service";
import {v4 as uuidv4} from "uuid";

export interface EventEnvelope<T = any> {
    eventId: string;
    messageId: string;
    traceId: string;
    eventType: string;
    timestamp: string;
    attempts: number;
    payload: T;
}

export interface PublishOptions {
    exchange?: string;
    routingKey?: string;
    priority?: number;
    delay?: number;
}

@Injectable()
export class RabbitMQPublisherService {
    private readonly logger = new Logger(RabbitMQPublisherService.name);
    private readonly defaultExchange = "events";

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly configService: ConfigService,
    ) {
    }

    async publish<T>(
        queue: string,
        eventType: string,
        payload: T,
        options?: PublishOptions,
    ): Promise<void> {
        try {
            const messageId = uuidv4();
            const traceId = uuidv4();
            const eventId = new Date().toISOString();
            const timestamp = new Date().toISOString();

            const envelope: EventEnvelope<T> = {
                eventId,
                messageId,
                traceId,
                eventType,
                timestamp,
                attempts: 0,
                payload,
            };

            // Garantir que a queue existe
            await this.rabbitmqService.assertQueue(queue);

            const channel = await this.rabbitmqService.getChannel();
            const exchange = options?.exchange || this.defaultExchange;

            // Assert exchange
            await channel.assertExchange(exchange, "topic", {durable: true});

            // Bind queue to exchange
            const routingKey = options?.routingKey || queue;
            await channel.bindQueue(queue, exchange, routingKey);

            // Publicar mensagem
            const messageBuffer = Buffer.from(JSON.stringify(envelope));
            const amqpOptions: any = {
                persistent: true,
                messageId,
                headers: {
                    traceId,
                    eventType,
                    attempts: 0,
                },
            };

            if (options?.priority) {
                amqpOptions.priority = options.priority;
            }

            if (options?.delay) {
                // Se delay exchange plugin estiver disponível
                amqpOptions.headers["x-delay"] = options.delay;
            }

            channel.publish(exchange, routingKey, messageBuffer, amqpOptions);

            this.logger.log(`Event published: ${eventType} to ${queue} (messageId: ${messageId})`);
        } catch (error) {
            this.logger.error(`Failed to publish event ${eventType} to ${queue}:`, error);
            // Não lançar erro para não bloquear o fluxo síncrono
            // Em produção, considerar outbox pattern
        }
    }

    async publishToQueue<T>(
        queue: string,
        eventType: string,
        payload: T,
        options?: PublishOptions,
    ): Promise<void> {
        try {
            const messageId = uuidv4();
            const traceId = uuidv4();
            const eventId = new Date().toISOString();
            const timestamp = new Date().toISOString();

            const envelope: EventEnvelope<T> = {
                eventId,
                messageId,
                traceId,
                eventType,
                timestamp,
                attempts: 0,
                payload,
            };

            // Garantir que a queue existe com DLQ
            const dlq = `${queue}.dlq`;
            await this.rabbitmqService.assertEventQueue(queue, dlq);

            const messageBuffer = Buffer.from(JSON.stringify(envelope));
            const amqpOptions: any = {
                persistent: true,
                messageId,
                headers: {
                    traceId,
                    eventType,
                    attempts: 0,
                },
            };

            if (options?.priority) {
                amqpOptions.priority = options.priority;
            }

            await this.rabbitmqService.sendToQueue(queue, messageBuffer, amqpOptions);

            this.logger.log(`Event published: ${eventType} to ${queue} (messageId: ${messageId})`);
        } catch (error) {
            this.logger.error(`Failed to publish event ${eventType} to ${queue}:`, error);
        }
    }
}

