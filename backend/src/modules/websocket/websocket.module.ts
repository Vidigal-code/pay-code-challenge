import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule} from "@nestjs/config";
import {RabbitMQModule} from "@infrastructure/messaging/rabbitmq.module";
import {FinancialEventsGateway} from "@interfaces/websocket/financial-events.gateway";
import {FinancialEventsConsumer} from "@interfaces/consumers/financial-events.consumer";

@Module({
    imports: [
        ConfigModule,
        JwtModule.register({}),
        RabbitMQModule,
    ],
    providers: [
        FinancialEventsGateway,
        FinancialEventsConsumer,
    ],
    exports: [FinancialEventsGateway],
})
export class WebSocketModule {
}

