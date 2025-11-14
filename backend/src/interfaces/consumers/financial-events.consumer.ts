import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {RabbitMQService} from "@infrastructure/messaging/rabbitmq.service";
import {FINANCIAL_EVENTS_QUEUE} from "@infrastructure/messaging/financial-events.producer";
import {FinancialEventsGateway} from "@interfaces/websocket/financial-events.gateway";

@Injectable()
export class FinancialEventsConsumer implements OnModuleInit {
    private readonly logger = new Logger(FinancialEventsConsumer.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly financialEventsGateway: FinancialEventsGateway,
    ) {
    }

    async onModuleInit() {
        try {
            await this.rabbitmqService.assertQueue(FINANCIAL_EVENTS_QUEUE);
            await this.rabbitmqService.setPrefetch(10);

            const channel = await this.rabbitmqService.getChannel();
            await channel.consume(FINANCIAL_EVENTS_QUEUE, async (msg: any) => {
                if (!msg) return;

                try {
                    const content = JSON.parse(msg.content.toString());
                    const {event, payload} = content;

                    this.logger.log(`Received financial event: ${event}`);

                    // Emitir via WebSocket para o usuário específico
                    const userId = payload.userId;
                    if (userId) {
                        switch (event) {
                            case "transaction.created":
                                this.financialEventsGateway.emitTransactionCreated(userId, payload);
                                break;
                            case "transaction.completed":
                                this.financialEventsGateway.emitTransactionCompleted(userId, payload);
                                break;
                            case "transaction.reversed":
                                this.financialEventsGateway.emitTransactionReversed(userId, payload);
                                break;
                            case "wallet.balance.updated":
                                this.financialEventsGateway.emitWalletBalanceUpdated(userId, payload);
                                break;
                        }
                    }

                    channel.ack(msg);
                } catch (error) {
                    this.logger.error(`Error processing financial event: ${(error as Error).message}`);
                    channel.nack(msg, false, false); // Rejeitar mensagem
                }
            });

            this.logger.log("Financial events consumer started");
        } catch (error) {
            this.logger.error(`Failed to start financial events consumer: ${(error as Error).message}`);
        }
    }
}

