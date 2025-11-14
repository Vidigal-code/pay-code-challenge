import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

let PrismaClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prismaModule = require("@prisma/client");
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  PrismaClient = class {
    $connect() {
      return Promise.resolve();
    }
    $disconnect() {
      return Promise.resolve();
    }
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    if (typeof (this as any).$connect === "function") {
      await (this as any).$connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (typeof (this as any).$disconnect === "function") {
      await (this as any).$disconnect();
    }
  }
}
