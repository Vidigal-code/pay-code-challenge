import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { UserRepository } from "@domain/repositories/user.repository";
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
  ) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const page = input.page || 1;
    const pageSize = input.pageSize || 10;

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

    const result = await this.transactionRepository.list({
      userId: input.userId,
      type,
      status,
      page,
      pageSize,
    });

    return {
      transactions: result.transactions,
      total: result.total,
      page,
      pageSize,
    };
  }
}
