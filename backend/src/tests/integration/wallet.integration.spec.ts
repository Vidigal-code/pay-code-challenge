import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import cookieParser from "cookie-parser";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { getTestDatabaseUrl, waitForDatabase } from "../setup/test-helpers";

describe("Wallet Integration Tests (e2e)", () => {
  let app: INestApplication | null = null;
  let prisma: PrismaService | null = null;
  let authToken: string;
  let userId: string;
  let user2Id: string;
  let dbAvailable = false;

  const skipIfNoDb = () => {
    if (!app || !dbAvailable) {
      console.warn("Skipping test - database not available");
      return true;
    }
    return false;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    try {
      const dbReady = await waitForDatabase(prisma, 30);
      if (!dbReady) {
        console.warn("Database not available, skipping integration tests");
        dbAvailable = false;
        return;
      }
      
      app.use(cookieParser());
      app.enableCors({
        origin: ["http://localhost:3000"],
        credentials: true,
      });
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }));
      
      await app.init();
      dbAvailable = true;
    } catch (error: any) {
      if (error?.message?.includes("Can't reach database server") || error?.code === "ECONNREFUSED" || error?.code === "P1001") {
        console.warn("Database not available, skipping integration tests");
        dbAvailable = false;
        return;
      }
      throw error;
    }
  }, 60000);

  beforeEach(async () => {
    if (skipIfNoDb()) return;
    if (prisma) {
      await prisma.transaction.deleteMany({});
      await prisma.wallet.deleteMany({});
      await prisma.user.deleteMany({});
    }
  });

  afterAll(async () => {
    if (app && prisma && dbAvailable) {
      try {
        await prisma.transaction.deleteMany({});
        await prisma.wallet.deleteMany({});
        await prisma.user.deleteMany({});
        await app.close();
      } catch (error) {
        console.warn("Error cleaning up test data:", error);
      }
    }
  });

  describe("Authentication Flow", () => {
    it("should register a new user", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("test@example.com");
      userId = response.body.id;
    });

    it("should login and get auth token", async () => {
      if (skipIfNoDb()) return;
     
      const signupResponse = await request(app!.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        });
      
      if (signupResponse.status !== 201 && signupResponse.status !== 409) {
        throw new Error(`Signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.body)}`);
      }
      
      const response = await request(app!.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const tokenCookie = cookieArray.find((c: string) => c.includes("paycode_session"));
      expect(tokenCookie).toBeDefined();
    });

    it("should register a second user for transfers", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "test2@example.com",
          name: "Test User 2",
          password: "password123",
        })
        .expect(201);

      user2Id = response.body.id;
    });
  });

  describe("Wallet Operations", () => {
    beforeEach(async () => {
      if (skipIfNoDb()) return;
    
      let loginResponse = await request(app!.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      if (loginResponse.status !== 200) {
        const signupResponse = await request(app!.getHttpServer())
          .post("/auth/signup")
          .send({
            email: "test@example.com",
            name: "Test User",
            password: "password123",
          });
        
        if (signupResponse.status !== 201 && signupResponse.status !== 409) {
          throw new Error(`Signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.body)}`);
        }
        
        loginResponse = await request(app!.getHttpServer())
          .post("/auth/login")
          .send({
            email: "test@example.com",
            password: "password123",
          });
      }

      if (loginResponse.status !== 200) {
        throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
      }

      const cookies = loginResponse.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      authToken = cookieArray.find((c: string) => c.includes("paycode_session"))?.split(";")[0] || "";
      
      if (!authToken) {
        throw new Error("Auth token not found in cookies");
      }
    });

    it("should create a wallet", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .post("/wallet")
        .set("Cookie", authToken);

      if (response.status === 409) {
        const getResponse = await request(app!.getHttpServer())
          .get("/wallet")
          .set("Cookie", authToken)
          .expect(200);
        
        expect(getResponse.body).toHaveProperty("wallet");
        expect(getResponse.body.wallet).toBeDefined();
        const wallet = getResponse.body.wallet;
        const balance = wallet.balance !== undefined ? wallet.balance : wallet.props?.balance;
        expect(balance).toBeDefined();
        return;
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("wallet");
      expect(response.body.wallet).toBeDefined();
      expect(response.body.wallet.balance).toBe(0);
    });

    it("should get wallet information", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .get("/wallet")
        .set("Cookie", authToken)
        .expect(200);

      expect(response.body).toHaveProperty("wallet");
      expect(response.body.wallet).toHaveProperty("balance");
      expect(response.body.wallet).toHaveProperty("userId");
    });

    it("should deposit money to wallet", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", authToken)
        .send({
          amount: 100.50,
          description: "Test deposit",
        })
        .expect(200);

      expect(response.body).toHaveProperty("transaction");
      expect(response.body).toHaveProperty("wallet");
      expect(response.body.wallet.balance).toBe(100.50);
      expect(response.body.transaction.type).toBe("DEPOSIT");
      expect(response.body.transaction.status).toBe("COMPLETED");
    });

    it("should deposit even with negative balance", async () => {
      if (skipIfNoDb()) return;
      await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", authToken)
        .send({ amount: -50 });

      const response = await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", authToken)
        .send({
          amount: 25,
          description: "Deposit with negative balance",
        })
        .expect(200);

      expect(response.body.wallet.balance).toBe(-25);
    });

    it("should transfer money to another user", async () => {
      if (skipIfNoDb()) return;
      // Ensure user2 exists
      if (!user2Id) {
        const signupResponse = await request(app!.getHttpServer())
          .post("/auth/signup")
          .send({
            email: "test2@example.com",
            name: "Test User 2",
            password: "password123",
          });
        
        if (signupResponse.status === 201 || signupResponse.status === 409) {
          user2Id = signupResponse.body.id || (await prisma!.user.findUnique({ where: { email: "test2@example.com" } }))?.id;
        }
      }

      await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", authToken)
        .send({ amount: 200 })
        .expect(200);

      const response = await request(app!.getHttpServer())
        .post("/wallet/transfer")
        .set("Cookie", authToken)
        .send({
          receiverId: user2Id,
          amount: 50,
          description: "Test transfer",
        })
        .expect(200);

      expect(response.body).toHaveProperty("transaction");
      expect(response.body).toHaveProperty("senderWallet");
      expect(response.body).toHaveProperty("receiverWallet");
      expect(response.body.senderWallet.balance).toBe(150);
      expect(response.body.receiverWallet.balance).toBe(50);
    });

    it("should reject transfer with insufficient balance", async () => {
      if (skipIfNoDb()) return;
      // Ensure user2 exists
      if (!user2Id) {
        const signupResponse = await request(app!.getHttpServer())
          .post("/auth/signup")
          .send({
            email: "test2@example.com",
            name: "Test User 2",
            password: "password123",
          });
        
        if (signupResponse.status === 201 || signupResponse.status === 409) {
          user2Id = signupResponse.body.id || (await prisma!.user.findUnique({ where: { email: "test2@example.com" } }))?.id;
        }
      }

      const response = await request(app!.getHttpServer())
        .post("/wallet/transfer")
        .set("Cookie", authToken)
        .send({
          receiverId: user2Id,
          amount: 10000,
        })
        .expect(400);

      expect(response.body.code).toBe("INSUFFICIENT_BALANCE");
    });

    it("should list transactions", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .get("/wallet/transactions")
        .set("Cookie", authToken)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body).toHaveProperty("transactions");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("pageSize");
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it("should reverse a deposit transaction", async () => {
      if (skipIfNoDb()) return;
      const depositResponse = await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", authToken)
        .send({ amount: 100 })
        .expect(200);

      expect(depositResponse.body).toHaveProperty("transaction");
      expect(depositResponse.body.transaction).toBeDefined();
      
      // Handle both serialized (with id directly) and unserialized (with props.id) formats
      const transaction = depositResponse.body.transaction;
      const transactionId = transaction.id || transaction.props?.id;
      expect(transactionId).toBeDefined();

      const response = await request(app!.getHttpServer())
        .post(`/wallet/transactions/${transactionId}/reverse`)
        .set("Cookie", authToken)
        .send({ reason: "Test reversal" })
        .expect(200);

      expect(response.body).toHaveProperty("reversalTransaction");
      expect(response.body).toHaveProperty("originalTransaction");
      expect(response.body.originalTransaction.status).toBe("REVERSED");
    });

    it("should get dashboard KPIs", async () => {
      if (skipIfNoDb()) return;
      const response = await request(app!.getHttpServer())
        .get("/wallet/dashboard/kpis")
        .set("Cookie", authToken)
        .expect(200);

      expect(response.body).toHaveProperty("kpis");
      expect(response.body.kpis).toHaveProperty("totalBalance");
      expect(response.body.kpis).toHaveProperty("totalDeposits");
      expect(response.body.kpis).toHaveProperty("totalTransfers");
      expect(response.body.kpis).toHaveProperty("totalReceived");
      expect(response.body.kpis).toHaveProperty("totalTransactions");
    });
  });

  describe("Error Handling", () => {
    it("should return 401 for unauthenticated requests", async () => {
      if (skipIfNoDb()) return;
      await request(app!.getHttpServer())
        .get("/wallet")
        .expect(401);
    });

    it("should return 400 for invalid deposit amount", async () => {
      if (skipIfNoDb()) return;
      const loginResponse = await request(app!.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      const cookies = loginResponse.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const token = cookieArray.find((c: string) => c.includes("paycode_session"))?.split(";")[0] || "";

      await request(app!.getHttpServer())
        .post("/wallet/deposit")
        .set("Cookie", token)
        .send({ amount: -10 })
        .expect(400);
    });
  });
});

