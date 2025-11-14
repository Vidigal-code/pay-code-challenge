import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {RabbitMQService} from "./rabbitmq.service";
import {IdempotencyService} from "../redis/idempotency.service";
import {EventEnvelope} from "./rabbitmq-publisher.service";

export interface ConsumerOptions {
    queue: string;
    dlq?: string;
    prefetch?: number;
    maxRetries?: number;
    backoffBaseMs?: number;
}

@Injectable()
export abstract class BaseConsumer implements OnModuleInit {
    protected readonly logger: Logger;
    protected readonly maxRetries: number;
    protected readonly backoffBaseMs: number;

    constructor(
        protected readonly rabbitmqService: RabbitMQService,
        protected readonly idempotencyService: IdempotencyService,
        protected readonly configService: ConfigService,
        protected readonly options: ConsumerOptions,
    ) {
        this.logger = new Logger(this.constructor.name);
        this.maxRetries = options.maxRetries ?? parseInt(process.env.RABBITMQ_RETRY_MAX ?? "5", 10);
        this.backoffBaseMs = options.backoffBaseMs ?? parseInt(process.env.RABBITMQ_BACKOFF_BASE_MS ?? "1000", 10);
    }

    async onModuleInit(): Promise<void> {
        try {
            const prefetch = this.options.prefetch ?? this.configService.get<number>("app.rabbitmq.prefetch") ?? 50;
            await this.rabbitmqService.setPrefetch(prefetch);

            const queue = this.options.queue;
            const dlq = this.options.dlq || `${queue}.dlq`;

            // Garantir que queue e DLQ existem
            await this.rabbitmqService.assertEventQueue(queue, dlq);

            const channel = await this.rabbitmqService.getChannel();

            await channel.consume(queue, async (msg: any) => {
                if (!msg) return;

                const startTime = Date.now();
                let messageId: string | undefined;
                let traceId: string | undefined;

                try {
                    const content = JSON.parse(msg.content.toString()) as EventEnvelope;
                    messageId = content.messageId;
                    traceId = content.traceId;
                    const attempts = content.attempts || parseInt(msg.properties.headers?.attempts as string || "0", 10);

                    this.logger.log(`Processing message: ${content.eventType} (messageId: ${messageId}, attempts: ${attempts})`);

                    // Verificar idempotência
                    if (await this.idempotencyService.isProcessed(messageId)) {
                        this.logger.warn(`Message ${messageId} already processed, skipping`);
                        channel.ack(msg);
                        return;
                    }

                    // Tentar adquirir lock
                    if (!(await this.idempotencyService.acquireLock(messageId, traceId))) {
                        this.logger.warn(`Message ${messageId} is already being processed, requeue`);
                        channel.nack(msg, false, true); // Requeue
                        return;
                    }

                    try {
                        // Processar mensagem
                        await this.handleMessage(content);

                        // Marcar como processado
                        await this.idempotencyService.markProcessed(messageId);

                        // ACK
                        channel.ack(msg);

                        const duration = Date.now() - startTime;
                        this.logger.log(`Message ${messageId} processed successfully in ${duration}ms`);
                    } catch (error) {
                        // Erro no processamento
                        await this.idempotencyService.releaseLock(messageId);

                        const newAttempts = attempts + 1;

                        if (newAttempts >= this.maxRetries) {
                            // Mover para DLQ
                            this.logger.error(`Message ${messageId} exceeded max retries, moving to DLQ`);
                            await this.moveToDLQ(channel, msg, content, error as Error);
                        } else {
                            // Requeue com backoff
                            const delay = this.calculateBackoff(newAttempts);
                            this.logger.warn(`Message ${messageId} failed (attempt ${newAttempts}/${this.maxRetries}), requeue with delay ${delay}ms`);

                            // Atualizar attempts no envelope
                            content.attempts = newAttempts;
                            const updatedBuffer = Buffer.from(JSON.stringify(content));

                            // Publicar novamente com delay (se delay exchange plugin disponível)
                            const headers = {
                                ...msg.properties.headers,
                                attempts: newAttempts,
                                "x-delay": delay,
                            };

                            channel.publish("", this.options.queue, updatedBuffer, {
                                persistent: true,
                                messageId,
                                headers,
                            });

                            channel.ack(msg);
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error processing message:`, error);
                    // NACK sem requeue para evitar loop infinito
                    channel.nack(msg, false, false);
                }
            });

            this.logger.log(`Consumer started for queue: ${this.options.queue}`);
        } catch (error) {
            this.logger.error(`Failed to start consumer for queue ${this.options.queue}:`, error);
        }
    }

    protected abstract handleMessage(envelope: EventEnvelope): Promise<void>;

    private async moveToDLQ(channel: any, msg: any, envelope: EventEnvelope, error: Error): Promise<void> {
        try {
            const dlq = this.options.dlq || `${this.options.queue}.dlq`;
            await this.rabbitmqService.assertQueue(dlq);

            const dlqEnvelope = {
                ...envelope,
                failureReason: error.message,
                failedAt: new Date().toISOString(),
            };

            const dlqBuffer = Buffer.from(JSON.stringify(dlqEnvelope));
            await this.rabbitmqService.sendToQueue(dlq, dlqBuffer, {
                persistent: true,
                messageId: envelope.messageId,
                headers: {
                    ...msg.properties.headers,
                    failureReason: error.message,
                    originalQueue: this.options.queue,
                },
            });

            channel.ack(msg);
            this.logger.log(`Message ${envelope.messageId} moved to DLQ: ${dlq}`);
        } catch (dlqError) {
            this.logger.error(`Failed to move message to DLQ:`, dlqError);
            channel.nack(msg, false, false);
        }
    }

    private calculateBackoff(attempts: number): number {
        const delay = this.backoffBaseMs * Math.pow(2, attempts - 1);
        const maxDelay = 300000; // 5 minutos
        return Math.min(delay, maxDelay);
    }
}

