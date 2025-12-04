import { Test, TestingModule } from "@nestjs/testing";
import { IdempotencyService } from "@infrastructure/redis/idempotency.service";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

jest.mock("ioredis");

describe("IdempotencyService", () => {
  let service: IdempotencyService;
  let configService: jest.Mocked<ConfigService>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    } as any;

    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

    configService = {
      get: jest.fn().mockReturnValue("redis://localhost:6379"),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("acquireLock", () => {
    it("should acquire lock successfully", async () => {
      mockRedis.set.mockResolvedValue("OK");

      const result = await service.acquireLock(
        "test-message-id",
        "test-trace-id",
      );

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "processing:test-message-id",
        "test-trace-id",
        "PX",
        3600000,
        "NX",
      );
    });

    it("should return false if lock already exists", async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await service.acquireLock(
        "test-message-id",
        "test-trace-id",
      );

      expect(result).toBe(false);
    });
  });

  describe("releaseLock", () => {
    it("should release lock", async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.releaseLock("test-message-id");

      expect(mockRedis.del).toHaveBeenCalledWith("processing:test-message-id");
    });
  });

  describe("isProcessed", () => {
    it("should return true if message is processed", async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.isProcessed("test-message-id");

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        "processed:test-message-id",
      );
    });

    it("should return false if message is not processed", async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.isProcessed("test-message-id");

      expect(result).toBe(false);
    });
  });

  describe("markProcessed", () => {
    it("should mark message as processed", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await service.markProcessed("test-message-id");

      expect(mockRedis.set).toHaveBeenCalledWith(
        "processed:test-message-id",
        expect.any(String),
        "PX",
        604800000,
      );
    });
  });
});
