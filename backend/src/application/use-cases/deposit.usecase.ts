import { WalletRepository } from "@domain/repositories/wallet.repository";
import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { ApplicationError } from "@application/errors/application-error";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@domain/entities/transaction.entity";
import { Wallet } from "@domain/entities/wallet.entity";
import { DomainEventsService } from "@domain/services/domain-events.service";
import { Logger } from "@nestjs/common";

export interface DepositInput {
  userId: string;
  amount: number;
  description?: string;
}

export class DepositUseCase {
  private readonly logger = new Logger(DepositUseCase.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(
    input: DepositInput,
  ): Promise<{ transaction: Transaction; wallet: Wallet }> {
    if (input.amount <= 0) {
      throw new ApplicationError("INVALID_AMOUNT");
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    let wallet = await this.walletRepository.findByUserId(input.userId);
    if (!wallet) {
      wallet = await this.walletRepository.create({
        userId: input.userId,
        balance: 0,
      });
    }

    const transaction = await this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      amount: input.amount,
      description: input.description || null,
    });

    const previousBalance = Number(wallet.balance);

    try {
      const walletEntity = Wallet.create({
        id: wallet.id,
        userId: wallet.userId,
        balance: previousBalance,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      });

      walletEntity.deposit(input.amount);

      wallet = await this.walletRepository.update({
        id: wallet.id,
        balance: walletEntity.balance,
      });

      await this.transactionRepository.update({
        id: transaction.id,
        status: TransactionStatus.COMPLETED,
      });

      const completedTransaction = await this.transactionRepository.findById(
        transaction.id,
      );

      await this.domainEvents.publish({
        name: "transaction.created",
        payload: {
          transactionId: transaction.id,
          walletId: wallet.id,
          userId: input.userId,
          type: TransactionType.DEPOSIT,
          amount: input.amount,
          status: TransactionStatus.PENDING,
          createdAt: transaction.createdAt.toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "transaction.completed",
        payload: {
          transactionId: completedTransaction!.id,
          walletId: wallet.id,
          userId: input.userId,
          type: TransactionType.DEPOSIT,
          amount: input.amount,
          newBalance: walletEntity.balance,
          completedAt: new Date().toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "wallet.balance.updated",
        payload: {
          walletId: wallet.id,
          userId: input.userId,
          previousBalance: previousBalance,
          newBalance: walletEntity.balance,
          transactionId: completedTransaction!.id,
          updatedAt: new Date().toISOString(),
        },
      });

      return {
        transaction: completedTransaction!,
        wallet,
      };
    } catch (error) {
      try {
        await this.walletRepository.update({
          id: wallet.id,
          balance: previousBalance,
        });
      } catch (rollbackError) {
        this.logger.error("Rollback failed:", rollbackError);
      }

      await this.transactionRepository.update({
        id: transaction.id,
        status: TransactionStatus.FAILED,
      });
      throw error;
    }
  }
}
