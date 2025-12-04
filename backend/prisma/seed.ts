import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash(
    "password123",
    Number(process.env.BCRYPT_COST || 10),
  );

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      name: "Owner User",
      passwordHash: hash,
    },
  });

  const wallet = await prisma.wallet.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      balance: 1000,
    },
  });

  await prisma.transaction.upsert({
    where: { id: "seed-transaction" },
    update: {},
    create: {
      id: "seed-transaction",
      walletId: wallet.id,
      amount: 1000,
      type: "DEPOSIT",
      status: "COMPLETED",
      description: "Initial deposit",
    },
  });

  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
