import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RabbitMQModule } from "@infrastructure/messaging/rabbitmq.module";
import { FinancialEventsWorker } from "./financial-events.worker";
import { AuditWorker } from "./audit.worker";

@Module({
  imports: [ConfigModule, RabbitMQModule],
  providers: [FinancialEventsWorker, AuditWorker],
  exports: [FinancialEventsWorker, AuditWorker],
})
export class WorkersModule {}
