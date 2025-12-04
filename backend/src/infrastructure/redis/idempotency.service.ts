import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class IdempotencyService {
  private readonly redis: Redis;
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly processingTtl: number;
  private readonly processedTtl: number;

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>("app.redisUrl") ||
      process.env.REDIS_URL ||
      "redis://localhost:6379";
    this.redis = new Redis(url);
    this.processingTtl = parseInt(
      process.env.REDIS_PROCESSING_TTL_MS ?? "3600000",
      10,
    ); // 1 hora
    this.processedTtl = parseInt(
      process.env.REDIS_PROCESSED_TTL_MS ?? "604800000",
      10,
    ); // 7 dias
  }

  async acquireLock(messageId: string, traceId: string): Promise<boolean> {
    try {
      const key = `processing:${messageId}`;
      const result = await this.redis.set(
        key,
        traceId,
        "PX",
        this.processingTtl,
        "NX",
      );
      return result === "OK";
    } catch (error) {
      this.logger.error(`Failed to acquire lock for ${messageId}:`, error);
      return false;
    }
  }

  async releaseLock(messageId: string): Promise<void> {
    try {
      const key = `processing:${messageId}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to release lock for ${messageId}:`, error);
    }
  }

  async isProcessed(messageId: string): Promise<boolean> {
    try {
      const key = `processed:${messageId}`;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check processed status for ${messageId}:`,
        error,
      );
      return false;
    }
  }

  async markProcessed(messageId: string, result?: any): Promise<void> {
    try {
      const key = `processed:${messageId}`;
      const value = result ? JSON.stringify(result) : new Date().toISOString();
      await this.redis.set(key, value, "PX", this.processedTtl);
    } catch (error) {
      this.logger.error(`Failed to mark processed for ${messageId}:`, error);
    }
  }

  async getProcessedResult(messageId: string): Promise<string | null> {
    try {
      const key = `processed:${messageId}`;
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get processed result for ${messageId}:`,
        error,
      );
      return null;
    }
  }
}
