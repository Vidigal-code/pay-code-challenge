import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { WalletRepository } from "@domain/repositories/wallet.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { ApplicationError } from "@application/errors/application-error";
import {
  TransactionType,
  TransactionStatus,
} from "@domain/entities/transaction.entity";

export interface GetDashboardKPIsInput {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardKPIs {
  totalBalance: number;
  totalDeposits: number;
  totalTransfers: number;
  totalReceived: number;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  reversedTransactions: number;
}

export class GetDashboardKPIsUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GetDashboardKPIsInput,
  ): Promise<{ kpis: DashboardKPIs }> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const wallet = await this.walletRepository.findByUserId(input.userId);
    const totalBalance = wallet ? Number(wallet.balance) : 0;

    const startDate =
      input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
    const endDate = input.endDate || new Date();

    const transactions = await this.transactionRepository.list({
      userId: input.userId,
      startDate,
      endDate,
    });

    const totalDeposits = transactions.transactions
      .filter(
        (t) =>
          t.type === TransactionType.DEPOSIT &&
          t.status === TransactionStatus.COMPLETED,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalTransfers = transactions.transactions
      .filter(
        (t) =>
          t.type === TransactionType.TRANSFER &&
          t.senderId === input.userId &&
          t.status === TransactionStatus.COMPLETED,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalReceived = transactions.transactions
      .filter(
        (t) =>
          t.type === TransactionType.TRANSFER &&
          t.receiverId === input.userId &&
          t.status === TransactionStatus.COMPLETED,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalTransactions = transactions.total;
    const completedTransactions = transactions.transactions.filter(
      (t) => t.status === TransactionStatus.COMPLETED,
    ).length;
    const failedTransactions = transactions.transactions.filter(
      (t) => t.status === TransactionStatus.FAILED,
    ).length;
    const reversedTransactions = transactions.transactions.filter(
      (t) => t.status === TransactionStatus.REVERSED,
    ).length;

    return {
      kpis: {
        totalBalance,
        totalDeposits,
        totalTransfers,
        totalReceived,
        totalTransactions,
        completedTransactions,
        failedTransactions,
        reversedTransactions,
      },
    };
  }
}
