import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RabbitMQService } from "./rabbitmq.service";
import { EventsProducer } from "./events.producer";
import { RabbitMQDomainEventsService } from "./domain-events.service";
import { FinancialEventsProducer } from "./financial-events.producer";
import { RabbitMQPublisherService } from "./rabbitmq-publisher.service";
import { IdempotencyService } from "../redis/idempotency.service";

@Module({
  imports: [ConfigModule],
  providers: [
    RabbitMQService,
    EventsProducer,
    FinancialEventsProducer,
    RabbitMQPublisherService,
    IdempotencyService,
    RabbitMQDomainEventsService,
    {
      provide: "DOMAIN_EVENTS_SERVICE",
      useClass: RabbitMQDomainEventsService,
    },
  ],
  exports: [
    RabbitMQService,
    EventsProducer,
    FinancialEventsProducer,
    RabbitMQPublisherService,
    IdempotencyService,
    RabbitMQDomainEventsService,
    "DOMAIN_EVENTS_SERVICE",
  ],
})
export class RabbitMQModule {}
