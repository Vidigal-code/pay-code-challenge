import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionsInput,
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from "@domain/repositories/transaction.repository";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@domain/entities/transaction.entity";

@Injectable()
export class TransactionPrismaRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionInput): Promise<Transaction> {
    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: data.walletId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        type: data.type,
        status: data.status ?? TransactionStatus.PENDING,
        amount: data.amount,
        description: data.description,
        originalTransactionId: data.originalTransactionId,
      },
    });
    return this.toDomain(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    return transaction ? this.toDomain(transaction) : null;
  }

  async update(data: UpdateTransactionInput): Promise<Transaction> {
    const transaction = await this.prisma.transaction.update({
      where: { id: data.id },
      data: {
        status: data.status,
        reversedById: data.reversedById,
        reversedAt: data.reversedAt,
      },
    });
    return this.toDomain(transaction);
  }

  async findByWalletId(
    walletId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transaction.count({ where: { walletId } }),
    ]);

    return {
      transactions: transactions.map((t: any) => this.toDomain(t)),
      total,
    };
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transaction.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),
    ]);

    return {
      transactions: transactions.map((t: any) => this.toDomain(t)),
      total,
    };
  }

  async list(
    input: ListTransactionsInput,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: any = {};

    if (input.walletId) {
      where.walletId = input.walletId;
    }

    if (input.userId) {
      where.OR = [{ senderId: input.userId }, { receiverId: input.userId }];
    }

    if (input.type) {
      where.type = input.type as TransactionType;
    }

    if (input.status) {
      where.status = input.status as TransactionStatus;
    }

    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) {
        where.createdAt.gte = input.startDate;
      }
      if (input.endDate) {
        where.createdAt.lte = input.endDate;
      }
    }

    const page = input.page || 1;
    const pageSize = input.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t: any) => this.toDomain(t)),
      total,
    };
  }

  async getTotalByType(
    type: TransactionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: any = { type };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    return Number(result._sum.amount || 0);
  }

  async getTotalByStatus(
    status: TransactionStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: any = { status };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    return this.prisma.transaction.count({ where });
  }

  private toDomain(record: any): Transaction {
    return Transaction.create({
      id: record.id,
      walletId: record.walletId,
      senderId: record.senderId,
      receiverId: record.receiverId,
      type: record.type as TransactionType,
      status: record.status as TransactionStatus,
      amount: Number(record.amount),
      description: record.description,
      reversedById: record.reversedById,
      reversedAt: record.reversedAt,
      originalTransactionId: record.originalTransactionId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

export const transactionRepositoryProvider = {
  provide: TRANSACTION_REPOSITORY,
  useClass: TransactionPrismaRepository,
};
