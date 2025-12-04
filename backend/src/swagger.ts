import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ErrorResponse } from "@application/dto/error.response.dto";

export function swaggerSetup(app: INestApplication) {
  const cfg = new DocumentBuilder()
    .setTitle("PAYCODE Fintech API")
    .setDescription(
      [
        "PAYCODE - Digital Wallet Fintech Platform",
        "",
        "## Main Features",
        "- **User Registration & Authentication**: User registration with email validation and JWT + JWE authentication",
        "- **Digital Wallet**: Each user has a unique wallet to manage balances",
        "- **Deposits**: Add funds to your wallet (supports negative balance)",
        "- **Transfers**: Send money to other users with balance validation",
        "- **Transaction Reversal**: All operations can be reversed for security",
        "- **Dashboard & KPIs**: Track financial metrics in real-time",
        "",
        "## Advanced Security",
        "- **JWT + JWE**: Encrypted tokens for secure authentication",
        "- **JWKS**: Automatic key rotation for continuous security",
        "- **KMS**: Key management (simulated locally, ready for AWS/GCP)",
        "- **JWE for Sensitive Data**: CPF, credit card numbers and transaction details encrypted",
        "- **OWASP API Security**: Protections against main security risks",
        "- **Rate Limiting**: 30 req/min general, 10 req/min for financial transactions",
        "- **TLS**: Secure end-to-end communication",
        "",
        "## Real-Time Events",
        "- **WebSocket**: Real-time notifications for transactions and balance updates",
        "- **RabbitMQ**: Asynchronous processing of financial events",
        "- Events: transaction.created, transaction.completed, transaction.reversed, wallet.balance.updated",
        "",
        "## Architecture",
        "- **DDD (Domain-Driven Design)**: Clear separation of responsibilities",
        "- **Hexagonal Architecture**: Isolation of external dependencies",
        "- **CQRS**: Separation of read and write operations",
        "- **Event-Driven Architecture**: Asynchronous processing with RabbitMQ",
        "",
        "## Error Codes",
        "All 4xx/5xx errors return JSON: { statusCode, code, message, timestamp, path }",
        "The 'code' field comes from the ErrorCode enum for frontend translation.",
        "",
        "## Business Rules",
        "- **Deposit**: Adds to balance even if negative (balance = current + amount)",
        "- **Transfer**: Validates sufficient balance before processing",
        "- **Reversal**: Can reverse COMPLETED DEPOSIT or TRANSFER transactions",
        "- **Rollback**: Automatic rollback on any operation failure",
        "- **Wallet**: Created automatically on user signup with zero balance",
        "",
        "## Observability",
        "- Structured logs (Pino)",
        "- Metrics (Prometheus)",
        "- Health checks (/health, /health/readiness)",
        "",
        "## Testing",
        "- Unit tests for all Use Cases",
        "- Integration tests (E2E) for complete flows",
        "- Test coverage for critical business rules",
      ].join("\n"),
    )
    .setVersion("2.0.0")
    .addServer("http://localhost:4000", "Local Development")
    .addServer("https://api.paycode.com", "Production")
    .addCookieAuth(process.env.COOKIE_NAME || "paycode_session", {
      type: "http",
      in: "cookie",
      scheme: "bearer",
      description: "JWT/JWE token stored in httpOnly cookie",
    })
    .addTag("auth", "Authentication and user management")
    .addTag("wallet", "Digital wallet operations")
    .addTag("observability", "Metrics and health checks")
    .addTag("security", "Security endpoints (JWKS)")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token (alternative to cookie auth)",
      },
      "JWT",
    )
    .build();
  const docs = SwaggerModule.createDocument(app, cfg, {
    extraModels: [ErrorResponse],
  });
  SwaggerModule.setup("doc", app, docs, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "PAYCODE Fintech API Documentation",
  });
}
