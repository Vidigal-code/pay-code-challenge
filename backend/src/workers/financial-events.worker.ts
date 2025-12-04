import { Injectable } from "@nestjs/common";
import {
  BaseConsumer,
  ConsumerOptions,
} from "@infrastructure/messaging/base-consumer";
import { RabbitMQService } from "@infrastructure/messaging/rabbitmq.service";
import { IdempotencyService } from "@infrastructure/redis/idempotency.service";
import { ConfigService } from "@nestjs/config";
import { EventEnvelope } from "@infrastructure/messaging/rabbitmq-publisher.service";

@Injectable()
export class FinancialEventsWorker extends BaseConsumer {
  constructor(
    rabbitmqService: RabbitMQService,
    idempotencyService: IdempotencyService,
    configService: ConfigService,
  ) {
    const options: ConsumerOptions = {
      queue: "financial_events",
      prefetch: 10,
      maxRetries: 5,
    };
    super(rabbitmqService, idempotencyService, configService, options);
  }

  protected async handleMessage(envelope: EventEnvelope): Promise<void> {
    this.logger.log(`Processing financial event: ${envelope.eventType}`, {
      messageId: envelope.messageId,
      traceId: envelope.traceId,
      payload: envelope.payload,
    });

    // Processar eventos financeiros
    switch (envelope.eventType) {
      case "transaction.created":
        await this.handleTransactionCreated(envelope.payload);
        break;
      case "transaction.completed":
        await this.handleTransactionCompleted(envelope.payload);
        break;
      case "transaction.reversed":
        await this.handleTransactionReversed(envelope.payload);
        break;
      case "wallet.balance.updated":
        await this.handleWalletBalanceUpdated(envelope.payload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${envelope.eventType}`);
    }
  }

  private async handleTransactionCreated(payload: any): Promise<void> {
    // Lógica de processamento assíncrono para transação criada
    // Ex: notificações, auditoria, etc.
    this.logger.log(`Transaction created: ${payload.transactionId}`);
  }

  private async handleTransactionCompleted(payload: any): Promise<void> {
    // Lógica de processamento assíncrono para transação completada
    this.logger.log(`Transaction completed: ${payload.transactionId}`);
  }

  private async handleTransactionReversed(payload: any): Promise<void> {
    // Lógica de processamento assíncrono para transação revertida
    this.logger.log(`Transaction reversed: ${payload.transactionId}`);
  }

  private async handleWalletBalanceUpdated(payload: any): Promise<void> {
    // Lógica de processamento assíncrono para atualização de saldo
    this.logger.log(`Wallet balance updated: ${payload.walletId}`);
  }
}
