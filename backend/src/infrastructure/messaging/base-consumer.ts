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
            
            const queue = this.options.queue;
            const dlq = this.options.dlq || `${queue}.dlq`;

            await this.rabbitmqService.assertEventQueue(queue, dlq);

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            let channel: any = null;
            let retries = 10;
            
            while (retries > 0 && (!channel || channel.closed)) {
                try {
                    channel = await this.rabbitmqService.getChannel();
                    if (channel && !channel.closed) {
                        try {
                            await channel.assertQueue(queue, {durable: true});
                            this.logger.log(`Queue ${queue} verified and ready`);
                            break;
                        } catch (assertError: any) {
                            if (assertError.code === 406) {
                                this.logger.log(`Queue ${queue} exists with different config, will use existing`);
                                break;
                            } else if (assertError.message?.includes('closed')) {
                                this.logger.warn(`Channel closed during assert, recreating...`);
                                await new Promise(resolve => setTimeout(resolve, 500));
                            } else {
                                this.logger.warn(`Error asserting queue ${queue}:`, assertError.message);
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }
                } catch (err: any) {
                    this.logger.warn(`Error getting channel (${retries} attempts left):`, err.message);
                }
                
                if (!channel || channel.closed) {
                    this.logger.warn(`Waiting for queue ${queue} to be ready (${retries} attempts left)...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                retries--;
            }
            
            if (!channel || channel.closed) {
                this.logger.error(`Failed to get open channel for queue ${queue} after retries. Workers will not start, but API will continue.`);
                return;
            }
            
            try {
                await this.rabbitmqService.setPrefetch(prefetch);
            } catch (prefetchError: any) {
                this.logger.warn(`Failed to set prefetch, continuing anyway:`, prefetchError.message);
                await new Promise(resolve => setTimeout(resolve, 300));
                try {
                    channel = await this.rabbitmqService.getChannel();
                    if (!channel || channel.closed) {
                        this.logger.error(`Channel is closed after prefetch error`);
                        return;
                    }
                } catch (err) {
                    this.logger.error(`Failed to get channel after prefetch error:`, err);
                    return;
                }
            }
            
            try {
                channel = await this.rabbitmqService.getChannel();
                if (!channel || channel.closed) {
                    this.logger.error(`Channel is closed after setPrefetch`);
                    return;
                }
            } catch (err) {
                this.logger.error(`Failed to get channel after setPrefetch:`, err);
                return;
            }

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

                    if (await this.idempotencyService.isProcessed(messageId)) {
                        this.logger.warn(`Message ${messageId} already processed, skipping`);
                        channel.ack(msg);
                        return;
                    }

                    if (!(await this.idempotencyService.acquireLock(messageId, traceId))) {
                        this.logger.warn(`Message ${messageId} is already being processed, requeue`);
                        channel.nack(msg, false, true); 
                        return;
                    }

                    try {
                        await this.handleMessage(content);

                        await this.idempotencyService.markProcessed(messageId);

                        channel.ack(msg);

                        const duration = Date.now() - startTime;
                        this.logger.log(`Message ${messageId} processed successfully in ${duration}ms`);
                    } catch (error) {
                        await this.idempotencyService.releaseLock(messageId);

                        const newAttempts = attempts + 1;

                        if (newAttempts >= this.maxRetries) {
                            this.logger.error(`Message ${messageId} exceeded max retries, moving to DLQ`);
                            await this.moveToDLQ(channel, msg, content, error as Error);
                        } else {
                            const delay = this.calculateBackoff(newAttempts);
                            this.logger.warn(`Message ${messageId} failed (attempt ${newAttempts}/${this.maxRetries}), requeue with delay ${delay}ms`);

                            content.attempts = newAttempts;
                            const updatedBuffer = Buffer.from(JSON.stringify(content));

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

