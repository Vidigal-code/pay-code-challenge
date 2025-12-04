import { Test } from "@nestjs/testing";
import { BaseConsumer } from "@infrastructure/messaging/base-consumer";
import { RabbitMQService } from "@infrastructure/messaging/rabbitmq.service";
import { IdempotencyService } from "@infrastructure/redis/idempotency.service";
import { ConfigService } from "@nestjs/config";
import { EventEnvelope } from "@infrastructure/messaging/rabbitmq-publisher.service";

class TestConsumer extends BaseConsumer {
  protected async handleMessage(envelope: EventEnvelope): Promise<void> {
    void envelope;
    // Test implementation
  }
}

describe("BaseConsumer", () => {
  let consumer: TestConsumer;
  let rabbitmqService: jest.Mocked<RabbitMQService>;
  let idempotencyService: jest.Mocked<IdempotencyService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    rabbitmqService = {
      setPrefetch: jest.fn().mockResolvedValue(undefined),
      assertEventQueue: jest.fn().mockResolvedValue(undefined),
      getChannel: jest.fn(),
    } as any;

    idempotencyService = {
      isProcessed: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
      markProcessed: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    await Test.createTestingModule({
      providers: [
        {
          provide: RabbitMQService,
          useValue: rabbitmqService,
        },
        {
          provide: IdempotencyService,
          useValue: idempotencyService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    consumer = new TestConsumer(
      rabbitmqService,
      idempotencyService,
      configService,
      {
        queue: "test_queue",
        prefetch: 10,
        maxRetries: 3,
      },
    );
  });

  it("should be defined", () => {
    expect(consumer).toBeDefined();
  });

  it("should check idempotency before processing", async () => {
    const mockChannel = {
      consume: jest.fn((queue, callback) => {
        const mockMsg = {
          content: Buffer.from(
            JSON.stringify({
              messageId: "test-message-id",
              traceId: "test-trace-id",
              eventType: "test.event",
              timestamp: "2024-01-01T00:00:00Z",
              attempts: 0,
              payload: {},
            }),
          ),
          properties: { headers: {} },
        };
        callback(mockMsg);
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };

    rabbitmqService.getChannel.mockResolvedValue(mockChannel as any);
    idempotencyService.isProcessed.mockResolvedValue(false);
    idempotencyService.acquireLock.mockResolvedValue(true);

    await consumer.onModuleInit();

    expect(idempotencyService.isProcessed).toHaveBeenCalledWith(
      "test-message-id",
    );
  });

  it("should skip processing if already processed", async () => {
    const mockChannel = {
      consume: jest.fn((queue, callback) => {
        const mockMsg = {
          content: Buffer.from(
            JSON.stringify({
              messageId: "test-message-id",
              traceId: "test-trace-id",
              eventType: "test.event",
              timestamp: "2024-01-01T00:00:00Z",
              attempts: 0,
              payload: {},
            }),
          ),
          properties: { headers: {} },
        };
        callback(mockMsg);
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };

    rabbitmqService.getChannel.mockResolvedValue(mockChannel as any);
    idempotencyService.isProcessed.mockResolvedValue(true);

    await consumer.onModuleInit();

    expect(idempotencyService.isProcessed).toHaveBeenCalled();
  });
});
