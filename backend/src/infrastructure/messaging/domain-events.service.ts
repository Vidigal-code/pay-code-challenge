import { Injectable } from "@nestjs/common";
import {
  DomainEvent,
  DomainEventsService,
} from "@domain/services/domain-events.service";
import { EventsProducer } from "./events.producer";
import { FinancialEventsProducer } from "./financial-events.producer";

@Injectable()
export class RabbitMQDomainEventsService implements DomainEventsService {
  constructor(
    private readonly eventsProducer: EventsProducer,
    private readonly financialEventsProducer: FinancialEventsProducer,
  ) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    switch (event.name) {
      case "transaction.created": {
        await this.financialEventsProducer.emitTransactionCreated(
          event.payload as any,
        );
        break;
      }
      case "transaction.completed": {
        await this.financialEventsProducer.emitTransactionCompleted(
          event.payload as any,
        );
        break;
      }
      case "transaction.reversed": {
        await this.financialEventsProducer.emitTransactionReversed(
          event.payload as any,
        );
        break;
      }
      case "wallet.balance.updated": {
        await this.financialEventsProducer.emitWalletBalanceUpdated(
          event.payload as any,
        );
        break;
      }
      default:
        // Eventos genéricos
        await this.eventsProducer.emitGenericEvent(
          event.payload as Record<string, unknown>,
        );
        break;
    }
  }
}
