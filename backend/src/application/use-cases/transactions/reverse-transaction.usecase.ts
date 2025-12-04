import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { WalletRepository } from "@domain/repositories/wallet.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { ApplicationError } from "@application/errors/application-error";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@domain/entities/transaction.entity";
import { Wallet } from "@domain/entities/wallet.entity";

export interface ReverseTransactionInput {
  transactionId: string;
  userId: string;
  reason?: string;
}

export class ReverseTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ReverseTransactionInput): Promise<{
    reversalTransaction: Transaction;
    originalTransaction: Transaction;
  }> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const originalTransaction = await this.transactionRepository.findById(
      input.transactionId,
    );
    if (!originalTransaction) {
      throw new ApplicationError("TRANSACTION_NOT_FOUND");
    }

    const transactionEntity = Transaction.create({
      id: originalTransaction.id,
      walletId: originalTransaction.walletId,
      senderId: originalTransaction.senderId,
      receiverId: originalTransaction.receiverId,
      type: originalTransaction.type,
      status: originalTransaction.status,
      amount: originalTransaction.amount,
      description: originalTransaction.description,
      reversedById: originalTransaction.reversedById,
      reversedAt: originalTransaction.reversedAt,
      originalTransactionId: originalTransaction.originalTransactionId,
      createdAt: originalTransaction.createdAt,
      updatedAt: originalTransaction.updatedAt,
    });

    if (!transactionEntity.canBeReversed()) {
      throw new ApplicationError("TRANSACTION_CANNOT_BE_REVERSED");
    }

    const senderWallet = originalTransaction.senderId
      ? await this.walletRepository.findByUserId(originalTransaction.senderId)
      : null;

    const receiverWallet = originalTransaction.receiverId
      ? await this.walletRepository.findByUserId(originalTransaction.receiverId)
      : null;

    const wallet = await this.walletRepository.findById(
      originalTransaction.walletId,
    );
    if (!wallet) {
      throw new ApplicationError("WALLET_NOT_FOUND");
    }

    const reversalTransaction = await this.transactionRepository.create({
      walletId: originalTransaction.walletId,
      senderId: originalTransaction.receiverId || null,
      receiverId: originalTransaction.senderId || null,
      type: TransactionType.REVERSAL,
      status: TransactionStatus.PENDING,
      amount: originalTransaction.amount,
      description:
        input.reason || `Reversal of transaction ${originalTransaction.id}`,
      originalTransactionId: originalTransaction.id,
    });

    try {
      if (originalTransaction.type === TransactionType.DEPOSIT) {
        const walletEntity = Wallet.create({
          id: wallet.id,
          userId: wallet.userId,
          balance: Number(wallet.balance),
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        });

        // Para reversão de depósito, sempre retira (mesmo que fique negativo)
        // O depósito deve adicionar ao valor se estiver negativo
        walletEntity.withdraw(originalTransaction.amount);
        await this.walletRepository.update({
          id: wallet.id,
          balance: walletEntity.balance,
        });
      } else if (originalTransaction.type === TransactionType.TRANSFER) {
        if (senderWallet && receiverWallet) {
          const senderWalletEntity = Wallet.create({
            id: senderWallet.id,
            userId: senderWallet.userId,
            balance: Number(senderWallet.balance),
            createdAt: senderWallet.createdAt,
            updatedAt: senderWallet.updatedAt,
          });

          const receiverWalletEntity = Wallet.create({
            id: receiverWallet.id,
            userId: receiverWallet.userId,
            balance: Number(receiverWallet.balance),
            createdAt: receiverWallet.createdAt,
            updatedAt: receiverWallet.updatedAt,
          });

          // Reversão: devolve o dinheiro ao sender e retira do receiver
          senderWalletEntity.deposit(originalTransaction.amount);

          // Para reversão, sempre retira do receiver (mesmo que fique negativo)
          // O depósito deve adicionar ao valor se estiver negativo
          receiverWalletEntity.withdraw(originalTransaction.amount);

          await this.walletRepository.update({
            id: senderWallet.id,
            balance: senderWalletEntity.balance,
          });

          await this.walletRepository.update({
            id: receiverWallet.id,
            balance: receiverWalletEntity.balance,
          });
        }
      }

      await this.transactionRepository.update({
        id: originalTransaction.id,
        status: TransactionStatus.REVERSED,
        reversedById: input.userId,
        reversedAt: new Date(),
      });

      await this.transactionRepository.update({
        id: reversalTransaction.id,
        status: TransactionStatus.COMPLETED,
      });

      const completedReversal = await this.transactionRepository.findById(
        reversalTransaction.id,
      );
      const updatedOriginal = await this.transactionRepository.findById(
        originalTransaction.id,
      );

      return {
        reversalTransaction: completedReversal!,
        originalTransaction: updatedOriginal!,
      };
    } catch (error) {
      await this.transactionRepository.update({
        id: reversalTransaction.id,
        status: TransactionStatus.FAILED,
      });
      throw error;
    }
  }
}
