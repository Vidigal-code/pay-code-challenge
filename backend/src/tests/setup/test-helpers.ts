export const getTestDatabaseUrl = (): string => {
  const isDocker = process.env.DOCKER_ENV === "true" || process.env.CI === "true";
  const dbHost = isDocker ? "db" : "localhost";
  
  if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.includes("localhost") && isDocker) {
      return process.env.DATABASE_URL.replace("localhost", "db");
    }
    if (process.env.DATABASE_URL.includes("db:5432") && !isDocker) {
      return process.env.DATABASE_URL.replace("db:5432", "localhost:5432");
    }
    return process.env.DATABASE_URL;
  }
  
  return `postgresql://postgres:postgres@${dbHost}:5432/paycode?schema=public`;
};

export const getTestApiUrl = (): string => {
  const isDocker = process.env.DOCKER_ENV === "true" || process.env.CI === "true";
  return isDocker ? "http://api:4000" : (process.env.API_URL || "http://localhost:4000");
};

export const waitForDatabase = async (prisma: any, maxRetries = 10): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};

