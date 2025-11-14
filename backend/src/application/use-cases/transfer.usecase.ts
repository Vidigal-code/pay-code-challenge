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

export interface TransferInput {
  senderId: string;
  receiverId: string;
  amount: number;
  description?: string;
}

export class TransferUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(input: TransferInput): Promise<{
    transaction: Transaction;
    senderWallet: Wallet;
    receiverWallet: Wallet;
  }> {
    if (input.amount <= 0) {
      throw new ApplicationError("INVALID_AMOUNT");
    }

    if (input.senderId === input.receiverId) {
      throw new ApplicationError("CANNOT_TRANSFER_TO_SELF");
    }

    const sender = await this.userRepository.findById(input.senderId);
    if (!sender) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const receiver = await this.userRepository.findById(input.receiverId);
    if (!receiver) {
      throw new ApplicationError("RECEIVER_NOT_FOUND");
    }

    let senderWallet = await this.walletRepository.findByUserId(input.senderId);
    if (!senderWallet) {
      senderWallet = await this.walletRepository.create({
        userId: input.senderId,
        balance: 0,
      });
    }

    let receiverWallet = await this.walletRepository.findByUserId(
      input.receiverId,
    );
    if (!receiverWallet) {
      receiverWallet = await this.walletRepository.create({
        userId: input.receiverId,
        balance: 0,
      });
    }

    const senderWalletEntity = Wallet.create({
      id: senderWallet.id,
      userId: senderWallet.userId,
      balance: Number(senderWallet.balance),
      createdAt: senderWallet.createdAt,
      updatedAt: senderWallet.updatedAt,
    });

    // Validate balance before transfer
    if (!senderWalletEntity.canWithdraw(input.amount)) {
      throw new ApplicationError("INSUFFICIENT_BALANCE");
    }

    const transaction = await this.transactionRepository.create({
      walletId: senderWallet.id,
      senderId: input.senderId,
      receiverId: input.receiverId,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      amount: input.amount,
      description: input.description || null,
    });

    const senderPreviousBalance = Number(senderWallet.balance);
    const receiverPreviousBalance = Number(receiverWallet.balance);
    let receiverTransactionId: string | null = null;

    try {
      // Use withdraw which allows negative balance for reversals
      // But we already validated with canWithdraw above
      senderWalletEntity.withdraw(input.amount);

      const receiverWalletEntity = Wallet.create({
        id: receiverWallet.id,
        userId: receiverWallet.userId,
        balance: receiverPreviousBalance,
        createdAt: receiverWallet.createdAt,
        updatedAt: receiverWallet.updatedAt,
      });

      receiverWalletEntity.deposit(input.amount);

      senderWallet = await this.walletRepository.update({
        id: senderWallet.id,
        balance: senderWalletEntity.balance,
      });

      receiverWallet = await this.walletRepository.update({
        id: receiverWallet.id,
        balance: receiverWalletEntity.balance,
      });

      const receiverTransaction = await this.transactionRepository.create({
        walletId: receiverWallet.id,
        senderId: input.senderId,
        receiverId: input.receiverId,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        amount: input.amount,
        description: input.description || null,
      });
      receiverTransactionId = receiverTransaction.id;

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
          walletId: senderWallet.id,
          userId: input.senderId,
          type: TransactionType.TRANSFER,
          amount: input.amount,
          status: TransactionStatus.PENDING,
          createdAt: transaction.createdAt.toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "transaction.completed",
        payload: {
          transactionId: completedTransaction!.id,
          walletId: senderWallet.id,
          userId: input.senderId,
          type: TransactionType.TRANSFER,
          amount: input.amount,
          newBalance: senderWalletEntity.balance,
          completedAt: new Date().toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "wallet.balance.updated",
        payload: {
          walletId: senderWallet.id,
          userId: input.senderId,
          previousBalance: senderPreviousBalance,
          newBalance: senderWalletEntity.balance,
          transactionId: completedTransaction!.id,
          updatedAt: new Date().toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "transaction.created",
        payload: {
          transactionId: receiverTransaction.id,
          walletId: receiverWallet.id,
          userId: input.receiverId,
          type: TransactionType.TRANSFER,
          amount: input.amount,
          status: TransactionStatus.COMPLETED,
          createdAt: receiverTransaction.createdAt.toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "transaction.completed",
        payload: {
          transactionId: receiverTransaction.id,
          walletId: receiverWallet.id,
          userId: input.receiverId,
          type: TransactionType.TRANSFER,
          amount: input.amount,
          newBalance: receiverWalletEntity.balance,
          completedAt: new Date().toISOString(),
        },
      });

      await this.domainEvents.publish({
        name: "wallet.balance.updated",
        payload: {
          walletId: receiverWallet.id,
          userId: input.receiverId,
          previousBalance: receiverPreviousBalance,
          newBalance: receiverWalletEntity.balance,
          transactionId: receiverTransaction.id,
          updatedAt: new Date().toISOString(),
        },
      });

      return {
        transaction: completedTransaction!,
        senderWallet,
        receiverWallet,
      };
    } catch (error) {
      try {
        await this.walletRepository.update({
          id: senderWallet.id,
          balance: senderPreviousBalance,
        });
        await this.walletRepository.update({
          id: receiverWallet.id,
          balance: receiverPreviousBalance,
        });

        if (receiverTransactionId) {
          await this.transactionRepository.update({
            id: receiverTransactionId,
            status: TransactionStatus.FAILED,
          });
        }
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }

      await this.transactionRepository.update({
        id: transaction.id,
        status: TransactionStatus.FAILED,
      });
      throw error;
    }
  }
}
