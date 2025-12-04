import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { WalletRepository } from "@domain/repositories/wallet.repository";
import { ApplicationError } from "@application/errors/application-error";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@domain/entities/transaction.entity";

export interface ListTransactionsInput {
  userId: string;
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
}

export interface ListTransactionsOutput {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize =
      input.pageSize && input.pageSize > 0 ? Math.min(input.pageSize, 100) : 10;

    const type = input.type
      ? (input.type.toUpperCase() as TransactionType)
      : undefined;
    const status = input.status
      ? (input.status.toUpperCase() as TransactionStatus)
      : undefined;

    if (type && !Object.values(TransactionType).includes(type)) {
      throw new ApplicationError("INVALID_TRANSACTION_TYPE");
    }

    if (status && !Object.values(TransactionStatus).includes(status)) {
      throw new ApplicationError("INVALID_TRANSACTION_STATUS");
    }

    const wallet = await this.walletRepository.findByUserId(user.id);
    if (!wallet) {
      return {
        transactions: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const result = await this.transactionRepository.list({
      walletId: wallet.id,
      type,
      status,
      page,
      pageSize,
    });

    const enrichedTransactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        const transactionData = transaction.toJSON();

        let senderInfo = null;
        let receiverInfo = null;

        if (transaction.senderId) {
          const sender = await this.userRepository.findById(
            transaction.senderId,
          );
          if (sender) {
            senderInfo = {
              id: sender.id,
              name: sender.name,
              email: sender.email.toString(),
            };
          }
        }

        if (transaction.receiverId) {
          const receiver = await this.userRepository.findById(
            transaction.receiverId,
          );
          if (receiver) {
            receiverInfo = {
              id: receiver.id,
              name: receiver.name,
              email: receiver.email.toString(),
            };
          }
        }

        return {
          ...transactionData,
          sender: senderInfo,
          receiver: receiverInfo,
        };
      }),
    );

    return {
      transactions: enrichedTransactions as any,
      total: result.total,
      page,
      pageSize,
    };
  }
}
