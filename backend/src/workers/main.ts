import {NestFactory} from "@nestjs/core";
import {AppModule} from "../app.module";
import {WorkersModule} from "./workers.module";
import {Logger} from "@nestjs/common";

async function bootstrap() {
    const logger = new Logger("WorkerBootstrap");
    
    // Criar contexto mínimo para workers
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ["error", "warn", "log"],
    });

    // Inicializar workers module
    const workersModule = app.select(WorkersModule);
    
    logger.log("Workers started successfully");
    
    // Manter processo vivo
    process.on("SIGTERM", async () => {
        logger.log("SIGTERM received, shutting down workers");
        await app.close();
        process.exit(0);
    });
    
    process.on("SIGINT", async () => {
        logger.log("SIGINT received, shutting down workers");
        await app.close();
        process.exit(0);
    });
}

bootstrap();

