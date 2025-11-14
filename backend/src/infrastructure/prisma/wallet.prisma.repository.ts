import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import {
  CreateWalletInput,
  UpdateWalletInput,
  WALLET_REPOSITORY,
  WalletRepository,
} from "@domain/repositories/wallet.repository";
import { Wallet } from "@domain/entities/wallet.entity";

@Injectable()
export class WalletPrismaRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWalletInput): Promise<Wallet> {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId: data.userId,
        balance: data.balance ?? 0,
      },
    });
    return this.toDomain(wallet);
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    return wallet ? this.toDomain(wallet) : null;
  }

  async findById(id: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });
    return wallet ? this.toDomain(wallet) : null;
  }

  async update(data: UpdateWalletInput): Promise<Wallet> {
    if (data.balance === undefined || data.balance === null) {
      throw new Error("Balance is required for wallet update");
    }
    try {
      const wallet = await this.prisma.wallet.update({
        where: { id: data.id },
        data: {
          balance: data.balance,
        },
      });
      return this.toDomain(wallet);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error("Wallet not found");
      }
      throw error;
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.wallet.delete({ where: { id } });
  }

  private toDomain(record: any): Wallet {
    return Wallet.create({
      id: record.id,
      userId: record.userId,
      balance: Number(record.balance),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

export const walletRepositoryProvider = {
  provide: WALLET_REPOSITORY,
  useClass: WalletPrismaRepository,
};
