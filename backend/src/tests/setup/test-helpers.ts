import { execSync } from "child_process";
import * as path from "path";

const sanitizeSchemaName = (schema: string): string => {
  return schema.replace(/[^a-zA-Z0-9_]/g, "_");
};

const resolveTestSchema = (): string => {
  if (process.env.TEST_DB_SCHEMA) {
    return sanitizeSchemaName(process.env.TEST_DB_SCHEMA);
  }

  const workerId = process.env.JEST_WORKER_ID || process.env.VITEST_WORKER_ID;
  if (workerId) {
    return sanitizeSchemaName(`test_${workerId}`);
  }

  return "test_public";
};

const applySchemaToUrl = (databaseUrl: string, schema: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    parsed.searchParams.set("schema", schema);
    return parsed.toString();
  } catch {
    const [base, query] = databaseUrl.split("?");
    const params = new URLSearchParams(query || "");
    params.set("schema", schema);
    const queryString = params.toString();
    return `${base}?${queryString}`;
  }
};

export const getTestDatabaseUrl = (): string => {
  const isDocker =
    process.env.DOCKER_ENV === "true" || process.env.CI === "true";
  const dbHost = isDocker ? "db" : "localhost";
  const schema = resolveTestSchema();

  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    if (url.includes("localhost") && isDocker) {
      url = url.replace("localhost", "db");
    } else if (url.includes("db:5432") && !isDocker) {
      url = url.replace("db:5432", "localhost:5432");
    }
    return applySchemaToUrl(url, schema);
  }

  const baseUrl = `postgresql://postgres:postgres@${dbHost}:5432/paycode`;
  return applySchemaToUrl(baseUrl, schema);
};

export const getTestApiUrl = (): string => {
  const isDocker =
    process.env.DOCKER_ENV === "true" || process.env.CI === "true";
  return isDocker
    ? "http://api:4000"
    : process.env.API_URL || "http://localhost:4000";
};

export const waitForDatabase = async (
  prisma: any,
  maxRetries = 30,
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      if (i === maxRetries - 1) {
        console.warn(
          `Database connection failed after ${maxRetries} attempts:`,
          error?.message,
        );
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return false;
};

/**
 * Execute Prisma migrations to ensure database schema is up to date
 */
export const runMigrations = async (): Promise<void> => {
  try {
    const backendPath = path.resolve(__dirname, "../../..");

    execSync("npx prisma migrate deploy", {
      cwd: backendPath,
      stdio: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || getTestDatabaseUrl(),
      },
    });

    console.log("Migrations executed successfully");
  } catch (error: any) {
    console.warn("Migration execution warning:", error?.message || error);
  }
};

/**
 * Check if database tables exist
 */
export const checkTablesExist = async (prisma: any): Promise<boolean> => {
  try {
    await prisma.$executeRawUnsafe(`SELECT 1 FROM "User" LIMIT 1`);
    await prisma.$executeRawUnsafe(`SELECT 1 FROM "Wallet" LIMIT 1`);
    await prisma.$executeRawUnsafe(`SELECT 1 FROM "Transaction" LIMIT 1`);
    return true;
  } catch (error: any) {
    // Check for Prisma error code (P2021 = table does not exist)
    if (error?.code === "P2021") {
      return false; // Tables don't exist
    }
    // Check for PostgreSQL error code (42P01 = relation does not exist)
    // This can appear in meta.code or in the error message
    if (
      error?.meta?.code === "42P01" ||
      error?.code === "42P01" ||
      (error?.message && error.message.includes("42P01")) ||
      (error?.message && error.message.includes("does not exist"))
    ) {
      return false; // Tables don't exist
    }
    throw error; // Other error, rethrow
  }
};

/**
 * Safely clean up test data, ignoring errors if tables don't exist
 */
export const cleanupTestData = async (prisma: any): Promise<void> => {
  if (!prisma) return;

  try {
    // Try to clean up in reverse order of dependencies
    await prisma.transaction.deleteMany({}).catch((error: any) => {
      // Ignore table not found errors (P2021)
      if (error?.code !== "P2021") {
        throw error;
      }
    });
    await prisma.wallet.deleteMany({}).catch((error: any) => {
      if (error?.code !== "P2021") {
        throw error;
      }
    });
    await prisma.user.deleteMany({}).catch((error: any) => {
      if (error?.code !== "P2021") {
        throw error;
      }
    });
  } catch (error: any) {
    // Only log non-P2021 errors
    if (error?.code !== "P2021") {
      console.warn("Error cleaning up test data:", error);
    }
  }
};
