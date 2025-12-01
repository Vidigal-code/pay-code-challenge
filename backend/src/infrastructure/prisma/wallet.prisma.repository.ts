import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import {
  CreateWalletInput,
  UpdateWalletInput,
  WALLET_REPOSITORY,
  WalletRepository,
} from "@domain/repositories/wallet.repository";
import { Wallet } from "@domain/entities/wallet.entity";
import { ApplicationError } from "@application/errors/application-error";
import { ErrorCode } from "@application/errors/error-code";

@Injectable()
export class WalletPrismaRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWalletInput): Promise<Wallet> {
    try {
      const balance = data.balance !== undefined 
        ? (typeof data.balance === 'string' ? parseFloat(data.balance) : Number(data.balance))
        : 0;
      const wallet = await this.prisma.wallet.create({
        data: {
          userId: data.userId,
          balance: isNaN(balance) ? 0 : balance,
        },
      });
      return this.toDomain(wallet);
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Wallet already exists - convert to ApplicationError
        throw new ApplicationError(ErrorCode.WALLET_ALREADY_EXISTS, `Wallet already exists for user ${data.userId}`);
      }
      // P2003 is foreign key constraint violation - user doesn't exist
      if (error.code === 'P2003') {
        throw new ApplicationError(ErrorCode.USER_NOT_FOUND, `User ${data.userId} does not exist - cannot create wallet`);
      }
      const errorMessage = error?.message || "Database error";
      throw new Error(`Failed to create wallet for user ${data.userId}: ${errorMessage}`);
    }
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
      const balance = typeof data.balance === 'string' 
        ? parseFloat(data.balance) 
        : Number(data.balance);
      const wallet = await this.prisma.wallet.update({
        where: { id: data.id },
        data: {
          balance: isNaN(balance) ? 0 : balance,
        },
      });
      return this.toDomain(wallet);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Wallet not found: ${data.id}`);
      }
      const errorMessage = error?.message || "Database error";
      throw new Error(`Failed to update wallet ${data.id}: ${errorMessage}`);
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.wallet.delete({ where: { id } });
  }

  private toDomain(record: any): Wallet {
    const balance = typeof record.balance === 'string' 
      ? parseFloat(record.balance) 
      : Number(record.balance);
    return Wallet.create({
      id: record.id,
      userId: record.userId,
      balance: isNaN(balance) ? 0 : balance,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

export const walletRepositoryProvider = {
  provide: WALLET_REPOSITORY,
  useClass: WalletPrismaRepository,
};
