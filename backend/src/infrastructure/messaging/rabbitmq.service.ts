import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any | null = null;
  private channel: any | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url =
      this.configService.get<string>("app.rabbitmqUrl") ||
      process.env.RABBITMQ_URL;
    if (!url) {
      this.logger.warn("RabbitMQ URL not configured. Skipping connection.");
      return;
    }
    await this.connectWithRetry(url);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async assertQueue(queue: string): Promise<void> {
    await this.ensureChannel();
    if (!this.channel) throw new Error("RABBITMQ_CHANNEL_NOT_INITIALIZED");
    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.logger.log(`Queue ${queue} created/verified`);
    } catch (error: any) {
      if (error.code === 406) {
        this.logger.warn(
          `Queue ${queue} exists with different config, will use existing`,
        );
        try {
          await this.channel.checkQueue(queue);
          this.logger.log(`Queue ${queue} exists and is usable`);
        } catch (checkError: any) {
          if (checkError.code === 404) {
            this.logger.log(`Queue ${queue} does not exist, creating...`);
            await this.ensureChannel();
            if (this.channel) {
              await this.channel.assertQueue(queue, { durable: true });
              this.logger.log(`Queue ${queue} created`);
            }
          } else {
            this.logger.warn(
              `Cannot check queue ${queue}:`,
              checkError.message,
            );
          }
        }
      } else if (error.message?.includes("closed")) {
        this.logger.warn(`Channel closed, recreating...`);
        await this.ensureChannel();
        if (this.channel) {
          try {
            await this.channel.assertQueue(queue, { durable: true });
            this.logger.log(
              `Queue ${queue} created/verified after channel recreation`,
            );
          } catch (retryError: any) {
            if (retryError.code === 406) {
              this.logger.log(`Queue ${queue} exists, will use existing`);
            } else {
              this.logger.error(
                `Failed to assert queue ${queue} after channel recreation:`,
                retryError.message,
              );
            }
          }
        }
      } else {
        this.logger.error(`Failed to assert queue ${queue}:`, error.message);
      }
    }
  }

  async sendToQueue(
    queue: string,
    content: Buffer,
    options?: any,
  ): Promise<void> {
    await this.ensureChannel();
    if (!this.channel) throw new Error("RABBITMQ_CHANNEL_NOT_INITIALIZED");
    await this.channel.sendToQueue(queue, content, {
      persistent: true,
      ...(options || {}),
    });
  }

  async getChannel(): Promise<any> {
    await this.ensureChannel();
    return this.channel;
  }

  private async ensureChannel(): Promise<void> {
    if (!this.connection) {
      throw new Error("RABBITMQ_CONNECTION_NOT_INITIALIZED");
    }

    if (!this.channel || this.channel.closed) {
      this.logger.warn("Channel closed or not initialized, recreating...");
      try {
        if (this.channel && !this.channel.closed) {
          await this.channel.close().catch(() => {});
        }
      } catch (e) {}
      this.channel = await this.connection.createChannel();
      this.setupChannelHandlers();
      this.logger.log("Channel recreated successfully");
    }
  }

  private setupChannelHandlers(): void {
    if (!this.channel) return;

    this.channel.on("error", (err: any) => {
      if (err.code === 406) {
        this.logger.warn(`RabbitMQ channel error (406): ${err.message}`);
        this.logger.warn(
          `This is expected when queue exists with different config. Channel will be recreated if needed.`,
        );
      } else {
        this.logger.error(`RabbitMQ channel error:`, err);
      }
    });

    this.channel.on("close", () => {
      this.logger.warn("RabbitMQ channel closed");
    });
  }

  async assertQueueWithOptions(queue: string, options: any): Promise<void> {
    await this.ensureChannel();
    if (!this.channel) throw new Error("RABBITMQ_CHANNEL_NOT_INITIALIZED");
    try {
      await this.channel.assertQueue(queue, {
        durable: true,
        ...(options || {}),
      });
    } catch (error: any) {
      if (error.code === 406) {
        this.logger.warn(
          `Queue ${queue} exists with different config, deleting and recreating...`,
        );
        try {
          await this.ensureChannel();
          const queueInfo = await this.channel.checkQueue(queue);
          if (queueInfo.messageCount > 0) {
            this.logger.warn(
              `Queue ${queue} has ${queueInfo.messageCount} messages, skipping recreation`,
            );
            return;
          }
          await this.channel.deleteQueue(queue, { ifEmpty: true });
        } catch (deleteError: any) {
          if (
            deleteError.code === 406 ||
            deleteError.message?.includes("closed")
          ) {
            this.logger.warn(
              `Cannot delete queue ${queue}, using existing queue`,
            );
            await this.ensureChannel();
            return;
          }
        }
        await this.ensureChannel();
        await this.channel.assertQueue(queue, {
          durable: true,
          ...(options || {}),
        });
      } else if (error.message?.includes("closed")) {
        await this.ensureChannel();
        await this.channel.assertQueue(queue, {
          durable: true,
          ...(options || {}),
        });
      } else {
        this.logger.error(
          `Failed to assert queue ${queue} with options:`,
          error.message,
        );
      }
    }
  }

  async assertEventQueue(queue: string, dlq: string): Promise<void> {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        await this.ensureChannel();
        if (!this.channel) throw new Error("RABBITMQ_CHANNEL_NOT_INITIALIZED");

        try {
          await this.channel.assertQueue(queue, { durable: true });
          this.logger.log(`Queue ${queue} created/verified`);

          await new Promise((resolve) => setTimeout(resolve, 100));

          try {
            await this.channel.assertQueue(dlq, { durable: true });
            this.logger.log(`DLQ ${dlq} created/verified`);
          } catch (dlqError: any) {
            if (dlqError.code === 406) {
              this.logger.log(
                `DLQ ${dlq} exists with different config, will use existing`,
              );
            } else if (dlqError.message?.includes("closed")) {
              this.logger.warn(
                `Channel closed while creating DLQ ${dlq}, will retry`,
              );
              attempts++;
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            } else {
              this.logger.warn(
                `Failed to assert DLQ ${dlq}:`,
                dlqError.message,
              );
            }
          }

          return;
        } catch (createError: any) {
          if (createError.code === 406) {
            this.logger.log(
              `Queue ${queue} exists with different config, will use existing`,
            );
            try {
              await this.ensureChannel();
              if (this.channel) {
                await this.channel.assertQueue(dlq, { durable: true });
                this.logger.log(`DLQ ${dlq} created/verified`);
              }
            } catch (dlqError: any) {
              if (dlqError.code === 406) {
                this.logger.log(
                  `DLQ ${dlq} exists with different config, will use existing`,
                );
              } else if (dlqError.message?.includes("closed")) {
                this.logger.warn(`Channel closed while creating DLQ ${dlq}`);
              } else {
                this.logger.warn(
                  `Failed to assert DLQ ${dlq}:`,
                  dlqError.message,
                );
              }
            }
            return;
          } else if (createError.message?.includes("closed")) {
            this.logger.warn(
              `Channel closed while creating queue ${queue}, retrying...`,
            );
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          } else {
            this.logger.error(
              `Failed to create queue ${queue}:`,
              createError.message,
            );
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
        }
      } catch (error: any) {
        this.logger.error(
          `Error in assertEventQueue for ${queue} (attempt ${attempts + 1}/${maxAttempts}):`,
          error.message,
        );
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await this.ensureChannel();
        }
      }
    }

    this.logger.error(
      `Failed to assert queue ${queue} after ${maxAttempts} attempts`,
    );
  }

  async setPrefetch(prefetch: number): Promise<void> {
    await this.ensureChannel();
    if (!this.channel) throw new Error("RABBITMQ_CHANNEL_NOT_INITIALIZED");
    await this.channel.prefetch(prefetch);
  }

  private async connectWithRetry(
    url: string,
    maxAttempts = 10,
    delayMs = 3000,
  ) {
    let lastErr: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(
          `Connecting to RabbitMQ (attempt ${attempt}/${maxAttempts})...`,
        );
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        this.setupChannelHandlers();

        this.connection.on("error", (err: any) => {
          this.logger.error(`RabbitMQ connection error:`, err);
        });

        this.connection.on("close", () => {
          this.logger.warn("RabbitMQ connection closed");
        });

        this.logger.log("RabbitMQ connected");
        return;
      } catch (err: any) {
        lastErr = err;
        const message = err?.message || String(err);
        this.logger.warn(`RabbitMQ connection failed: ${message}`);
        if (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    this.logger.error("Exhausted retries connecting to RabbitMQ");
    throw lastErr;
  }
}
