import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import {swaggerSetup} from "./swagger";
import {HttpException, ValidationPipe} from "@nestjs/common";
import pinoHttp from "pino-http";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {bufferLogs: true});
    app.use(helmet());
    app.use(cookieParser());
    app.use(
        pinoHttp({
            autoLogging: false,
            transport:
                process.env.NODE_ENV !== "production"
                    ? {target: "pino-pretty", options: {singleLine: true}}
                    : undefined,
        }),
    );
    app.enableCors({
        origin: ["http://localhost:3000"],
        credentials: true,
    });
    // Rate limiting rigoroso para fintech
    app.use(
        rateLimit({
            windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), // 1 minuto
            max: Number(process.env.RATE_LIMIT_MAX || 30), // 30 requisições por minuto (mais restritivo)
            message: "Too many requests, please try again later",
            standardHeaders: true,
            legacyHeaders: false,
        }),
    );
    
    // Rate limiting específico para endpoints financeiros (mais restritivo)
    app.use(
        "/wallet/(deposit|transfer)",
        rateLimit({
            windowMs: 60000, // 1 minuto
            max: 10, // Apenas 10 transações por minuto
            message: "Transaction rate limit exceeded. Please wait before making another transaction.",
        }),
    );
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map((error) => {
                const constraints = error.constraints || {};
                return Object.values(constraints)[0] || `${error.property} is invalid`;
            });
            return new HttpException(
                {
                    message: messages,
                    error: "Bad Request",
                    statusCode: 400,
                },
                400,
            );
        },
    }));

    swaggerSetup(app);

    const port = Number(process.env.PORT) || 4000;
    await app.listen(port, '0.0.0.0');
}

bootstrap();

