import {Injectable} from "@nestjs/common";
import {BaseConsumer, ConsumerOptions} from "@infrastructure/messaging/base-consumer";
import {RabbitMQService} from "@infrastructure/messaging/rabbitmq.service";
import {IdempotencyService} from "@infrastructure/redis/idempotency.service";
import {ConfigService} from "@nestjs/config";
import {EventEnvelope} from "@infrastructure/messaging/rabbitmq-publisher.service";

@Injectable()
export class AuditWorker extends BaseConsumer {

    constructor(
        rabbitmqService: RabbitMQService,
        idempotencyService: IdempotencyService,
        configService: ConfigService,
    ) {
        const options: ConsumerOptions = {
            queue: "audit.logs",
            prefetch: 20,
            maxRetries: 3,
        };
        super(rabbitmqService, idempotencyService, configService, options);
    }

    protected async handleMessage(envelope: EventEnvelope): Promise<void> {
        this.logger.log(`Audit log: ${envelope.eventType}`, {
            messageId: envelope.messageId,
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
            payload: envelope.payload,
        });

        // Em produção, salvar em banco de dados de auditoria ou sistema de logs
        // Por enquanto, apenas log estruturado
    }
}


