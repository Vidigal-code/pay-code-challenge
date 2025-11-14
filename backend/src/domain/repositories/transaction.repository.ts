import {Transaction, TransactionType, TransactionStatus} from "../entities/transaction.entity";

export interface CreateTransactionInput {
    walletId: string;
    senderId?: string | null;
    receiverId?: string | null;
    type: TransactionType;
    status?: TransactionStatus;
    amount: number;
    description?: string | null;
    originalTransactionId?: string | null;
}

export interface UpdateTransactionInput {
    id: string;
    status?: TransactionStatus;
    reversedById?: string | null;
    reversedAt?: Date | null;
}

export interface ListTransactionsInput {
    walletId?: string;
    userId?: string;
    type?: TransactionType;
    status?: TransactionStatus;
    page?: number;
    pageSize?: number;
    startDate?: Date;
    endDate?: Date;
}

export interface TransactionRepository {
    create(data: CreateTransactionInput): Promise<Transaction>;

    findById(id: string): Promise<Transaction | null>;

    update(data: UpdateTransactionInput): Promise<Transaction>;

    findByWalletId(walletId: string, page?: number, pageSize?: number): Promise<{transactions: Transaction[]; total: number}>;

    findByUserId(userId: string, page?: number, pageSize?: number): Promise<{transactions: Transaction[]; total: number}>;

    list(input: ListTransactionsInput): Promise<{transactions: Transaction[]; total: number}>;

    getTotalByType(type: TransactionType, startDate?: Date, endDate?: Date): Promise<number>;

    getTotalByStatus(status: TransactionStatus, startDate?: Date, endDate?: Date): Promise<number>;
}

export const TRANSACTION_REPOSITORY = Symbol("TRANSACTION_REPOSITORY");

