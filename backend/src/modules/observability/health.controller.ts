import {Controller, Get, HttpCode} from "@nestjs/common";
import {PrismaService} from "@infrastructure/prisma/prisma.service";
import {ConfigService} from "@nestjs/config";
import {RabbitMQService} from "@infrastructure/messaging/rabbitmq.service";
import Redis from "ioredis";

@Controller("health")
export class HealthController {
    private redis: Redis | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly rabbit: RabbitMQService,
    ) {
        const redisUrl = this.config.get<string>("app.redisUrl") || process.env.REDIS_URL || "redis://localhost:6379";
        this.redis = new Redis(redisUrl);
    }

    @Get()
    @HttpCode(200)
    async getHealth() {
        const checks: Record<string, { status: string; details?: any }> = {};

        // DB check
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.postgres = {status: "up"};
        } catch (err: any) {
            checks.postgres = {status: "down", details: err?.message};
        }

        // RabbitMQ check
        try {
            await this.rabbit.getChannel();
            checks.rabbitmq = {status: "up"};
        } catch (err: any) {
            checks.rabbitmq = {status: "down", details: err?.message};
        }

        // Redis check
        try {
            if (this.redis) {
                await this.redis.ping();
                checks.redis = {status: "up"};
            } else {
                checks.redis = {status: "down", details: "Redis client not initialized"};
            }
        } catch (err: any) {
            checks.redis = {status: "down", details: err?.message};
        }

        const allUp = Object.values(checks).every((c) => c.status === "up");
        return {
            status: allUp ? "ok" : "degraded",
            checks,
            timestamp: new Date().toISOString(),
        };
    }

    @Get("readiness")
    @HttpCode(200)
    async getReadiness() {
        const checks: Record<string, { status: string; details?: any }> = {};

        // DB migrations check
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            // Verificar se tabelas principais existem
            await this.prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
            checks.database = {status: "ready", details: "Migrations applied"};
        } catch (err: any) {
            checks.database = {status: "not_ready", details: err?.message};
        }

        // RabbitMQ queues check
        try {
            const channel = await this.rabbit.getChannel();
            // Verificar se queues principais existem
            await this.rabbit.assertQueue("financial_events");
            checks.queues = {status: "ready", details: "Queues declared"};
        } catch (err: any) {
            checks.queues = {status: "not_ready", details: err?.message};
        }

        const allReady = Object.values(checks).every((c) => c.status === "ready");
        return {
            status: allReady ? "ready" : "not_ready",
            checks,
            timestamp: new Date().toISOString(),
        };
    }
}
