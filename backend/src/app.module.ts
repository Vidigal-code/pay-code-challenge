import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "@config/app.config";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AuthInfraModule } from "@infrastructure/auth/auth-infra.module";
import { RabbitMQModule } from "@infrastructure/messaging/rabbitmq.module";
import { AuthModule } from "@modules/auth/auth.module";
import { WalletModule } from "@modules/wallet/wallet.module";
import { WebSocketModule } from "@modules/websocket/websocket.module";
import { WorkersModule } from "@workers/workers.module";
import { AllExceptionsFilter } from "@common/filters/all-exceptions.filter";
import { BigIntSerializationInterceptor } from "@common/interceptors/bigint-serialization.interceptor";
import { SuccessCodeInterceptor } from "@common/interceptors/success-code.interceptor";
import { ObservabilityModule } from "@modules/observability/observability.module";
import { RequestMetricsInterceptor } from "@modules/observability/services/request-metrics.interceptor";
import { LoggerModule } from "nestjs-pino";
import { JWKSController } from "@interfaces/http/jwks.controller";
import { APP_GUARD } from "@nestjs/core";
import { OWASPSecurityGuard } from "@common/guards/owasp-security.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [".env", ".env.local"],
    }),
    InfrastructureModule,
    AuthInfraModule,
    RabbitMQModule,
    AuthModule,
    WalletModule,
    WebSocketModule,
    WorkersModule, // Workers module for async processing
    ObservabilityModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { singleLine: true } }
            : undefined,
        autoLogging: false,
      },
    }),
  ],
  controllers: [JWKSController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestMetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntSerializationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessCodeInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: OWASPSecurityGuard,
    },
  ],
})
export class AppModule {}
