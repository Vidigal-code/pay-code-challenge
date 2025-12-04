import { Injectable, Logger } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";

export const FINANCIAL_EVENTS_QUEUE = "financial_events";
export const FINANCIAL_EVENTS_EXCHANGE = "financial_events_exchange";

export interface TransactionCreatedEvent {
  transactionId: string;
  walletId: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface TransactionCompletedEvent {
  transactionId: string;
  walletId: string;
  userId: string;
  type: string;
  amount: number;
  newBalance: number;
  completedAt: string;
}

export interface TransactionReversedEvent {
  transactionId: string;
  originalTransactionId: string;
  walletId: string;
  userId: string;
  amount: number;
  reversedAt: string;
}

export interface WalletBalanceUpdatedEvent {
  walletId: string;
  userId: string;
  previousBalance: number;
  newBalance: number;
  transactionId: string;
  updatedAt: string;
}

@Injectable()
export class FinancialEventsProducer {
  private readonly logger = new Logger(FinancialEventsProducer.name);

  constructor(private readonly rabbitmqService: RabbitMQService) {}

  async emitTransactionCreated(event: TransactionCreatedEvent): Promise<void> {
    try {
      await this.rabbitmqService.assertQueue(FINANCIAL_EVENTS_QUEUE);
      await this.rabbitmqService.sendToQueue(
        FINANCIAL_EVENTS_QUEUE,
        Buffer.from(
          JSON.stringify({
            event: "transaction.created",
            payload: event,
            timestamp: new Date().toISOString(),
          }),
        ),
      );
      this.logger.log(
        `Transaction created event emitted: ${event.transactionId}`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to emit transaction created event",
        error as Error,
      );
    }
  }

  async emitTransactionCompleted(
    event: TransactionCompletedEvent,
  ): Promise<void> {
    try {
      await this.rabbitmqService.assertQueue(FINANCIAL_EVENTS_QUEUE);
      await this.rabbitmqService.sendToQueue(
        FINANCIAL_EVENTS_QUEUE,
        Buffer.from(
          JSON.stringify({
            event: "transaction.completed",
            payload: event,
            timestamp: new Date().toISOString(),
          }),
        ),
      );
      this.logger.log(
        `Transaction completed event emitted: ${event.transactionId}`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to emit transaction completed event",
        error as Error,
      );
    }
  }

  async emitTransactionReversed(
    event: TransactionReversedEvent,
  ): Promise<void> {
    try {
      await this.rabbitmqService.assertQueue(FINANCIAL_EVENTS_QUEUE);
      await this.rabbitmqService.sendToQueue(
        FINANCIAL_EVENTS_QUEUE,
        Buffer.from(
          JSON.stringify({
            event: "transaction.reversed",
            payload: event,
            timestamp: new Date().toISOString(),
          }),
        ),
      );
      this.logger.log(
        `Transaction reversed event emitted: ${event.transactionId}`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to emit transaction reversed event",
        error as Error,
      );
    }
  }

  async emitWalletBalanceUpdated(
    event: WalletBalanceUpdatedEvent,
  ): Promise<void> {
    try {
      await this.rabbitmqService.assertQueue(FINANCIAL_EVENTS_QUEUE);
      await this.rabbitmqService.sendToQueue(
        FINANCIAL_EVENTS_QUEUE,
        Buffer.from(
          JSON.stringify({
            event: "wallet.balance.updated",
            payload: event,
            timestamp: new Date().toISOString(),
          }),
        ),
      );
      this.logger.log(
        `Wallet balance updated event emitted: ${event.walletId}`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to emit wallet balance updated event",
        error as Error,
      );
    }
  }
}
