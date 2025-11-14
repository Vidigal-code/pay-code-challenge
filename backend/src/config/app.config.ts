import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:3000",
  jwt: {
    secret: process.env.JWT_SECRET ?? "secret",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    cookieName: process.env.COOKIE_NAME ?? "paycode_session",
  },
  jwe: {
    enabled: (process.env.JWE_ENABLED ?? "true").toLowerCase() === "true",
    secret:
      process.env.JWE_SECRET ??
      process.env.JWT_SECRET ??
      "your-256-bit-secret-key-must-be-32-chars-long!!",
  },
  jwks: {
    rotationInterval: parseInt(
      process.env.JWKS_ROTATION_INTERVAL ?? "86400000",
      10,
    ),
  },
  kms: {
    keyId: process.env.KMS_KEY_ID ?? "sensitive-data-key",
    masterKey: process.env.KMS_MASTER_KEY,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "30", 10),
    transactionMax: parseInt(
      process.env.RATE_LIMIT_TRANSACTION_MAX ?? "10",
      10,
    ),
  },
  bcryptCost: parseInt(process.env.BCRYPT_COST ?? "10", 10),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  rabbitmqUrl: process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672",
  rabbitmq: {
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH ?? "50", 10),
    retryMax: parseInt(process.env.RABBITMQ_RETRY_MAX ?? "5", 10),
  },
  emailValidation: {
    cacheTtlHitSeconds: parseInt(
      process.env.EMAIL_VALIDATION_TTL_HIT ?? "1800",
      10,
    ),
    cacheTtlMissSeconds: parseInt(
      process.env.EMAIL_VALIDATION_TTL_MISS ?? "120",
      10,
    ),
  },
  invite: {
    tokenBytes: parseInt(process.env.INVITE_TOKEN_BYTES ?? "32", 10),
  },
}));
