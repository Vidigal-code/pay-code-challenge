import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

describe("Auth Integration Tests (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe("POST /auth/signup", () => {
    it("should create a new user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("newuser@example.com");
      expect(response.body.name).toBe("New User");
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("should reject duplicate email", async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "duplicate@example.com",
          name: "User 1",
          password: "password123",
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "duplicate@example.com",
          name: "User 2",
          password: "password123",
        })
        .expect(409);

      expect(response.body.code).toBe("EMAIL_ALREADY_USED");
    });

    it("should reject invalid email", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "invalid-email",
          name: "User",
          password: "password123",
        })
        .expect(400);
    });

    it("should reject missing required fields", async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "test@example.com",
        })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "loginuser@example.com",
          name: "Login User",
          password: "password123",
        });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "loginuser@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("loginuser@example.com");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "loginuser@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject non-existent user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /auth/profile", () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "profileuser@example.com",
          name: "Profile User",
          password: "password123",
        });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "profileuser@example.com",
          password: "password123",
        });

      const cookies = loginResponse.headers["set-cookie"];
      authToken = cookies.find((c: string) => c.includes("paycode_session"))?.split(";")[0] || "";
    });

    it("should get user profile when authenticated", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/profile")
        .set("Cookie", authToken)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("profileuser@example.com");
      expect(response.body.name).toBe("Profile User");
    });

    it("should reject unauthenticated requests", async () => {
      await request(app.getHttpServer())
        .get("/auth/profile")
        .expect(401);
    });
  });

  describe("POST /auth/profile", () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          email: "updateuser@example.com",
          name: "Update User",
          password: "password123",
        });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "updateuser@example.com",
          password: "password123",
        });

      const cookies = loginResponse.headers["set-cookie"];
      authToken = cookies.find((c: string) => c.includes("paycode_session"))?.split(";")[0] || "";
    });

    it("should update user profile", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/profile")
        .set("Cookie", authToken)
        .send({
          name: "Updated Name",
        })
        .expect(200);

      expect(response.body.name).toBe("Updated Name");
    });

    it("should update password with current password", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/profile")
        .set("Cookie", authToken)
        .send({
          currentPassword: "password123",
          newPassword: "newpassword123",
        })
        .expect(200);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "updateuser@example.com",
          password: "newpassword123",
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("id");
    });

    it("should reject password update without current password", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/profile")
        .set("Cookie", authToken)
        .send({
          newPassword: "newpassword123",
        })
        .expect(400);

      expect(response.body.code).toBe("CURRENT_PASSWORD_REQUIRED");
    });
  });
});

