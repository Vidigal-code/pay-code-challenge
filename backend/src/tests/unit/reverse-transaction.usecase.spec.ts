import {ReverseTransactionUseCase} from "@application/use-cases/reverse-transaction.usecase";
import {WalletRepository} from "@domain/repositories/wallet.repository";
import {TransactionRepository} from "@domain/repositories/transaction.repository";
import {UserRepository} from "@domain/repositories/user.repository";
import {ApplicationError} from "@application/errors/application-error";
import {Transaction, TransactionType, TransactionStatus} from "@domain/entities/transaction.entity";

describe("ReverseTransactionUseCase", () => {
    let useCase: ReverseTransactionUseCase;
    let walletRepository: jest.Mocked<WalletRepository>;
    let transactionRepository: jest.Mocked<TransactionRepository>;
    let userRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        walletRepository = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
        } as any;

        transactionRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            list: jest.fn(),
            findByWalletId: jest.fn(),
            findByUserId: jest.fn(),
            getTotalByType: jest.fn(),
            getTotalByStatus: jest.fn(),
        } as any;

        userRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as any;

        useCase = new ReverseTransactionUseCase(
            transactionRepository,
            walletRepository,
            userRepository,
        );
    });

    it("should reverse a deposit transaction", async () => {
        const userId = "user123";
        const transactionId = "tx123";
        const walletId = "wallet123";

        const originalTransaction = Transaction.create({
            id: transactionId,
            walletId,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            amount: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        transactionRepository.findById.mockResolvedValue(originalTransaction);

        userRepository.findById.mockResolvedValue({
            id: userId,
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.findById.mockResolvedValue({
            id: walletId,
            userId,
            balance: 150,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.create.mockResolvedValue({
            id: "reversal123",
            walletId,
            type: TransactionType.REVERSAL,
            status: TransactionStatus.PENDING,
            amount: 100,
            originalTransactionId: transactionId,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.update.mockResolvedValue({
            id: walletId,
            userId,
            balance: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.update.mockResolvedValue({
            id: "reversal123",
            status: TransactionStatus.COMPLETED,
        } as any);
        transactionRepository.findById
            .mockResolvedValueOnce(originalTransaction)
            .mockResolvedValueOnce({
                id: "reversal123",
                status: TransactionStatus.COMPLETED,
            } as any);

        const result = await useCase.execute({
            transactionId,
            userId,
            reason: "User request",
        });

        expect(result.reversalTransaction.status).toBe(TransactionStatus.COMPLETED);
        expect(walletRepository.update).toHaveBeenCalled();
    });

    it("should throw error if transaction not found", async () => {
        transactionRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({
                transactionId: "invalid",
                userId: "user123",
            }),
        ).rejects.toThrow(ApplicationError);
    });

    it("should reverse a transfer transaction", async () => {
        const userId = "user123";
        const senderId = "sender123";
        const receiverId = "receiver123";
        const transactionId = "tx123";
        const senderWalletId = "wallet1";
        const receiverWalletId = "wallet2";

        const originalTransaction = Transaction.create({
            id: transactionId,
            walletId: senderWalletId,
            senderId,
            receiverId,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.COMPLETED,
            amount: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        transactionRepository.findById.mockResolvedValue(originalTransaction);

        userRepository.findById.mockResolvedValue({
            id: userId,
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.findByUserId
            .mockResolvedValueOnce({
                id: senderWalletId,
                userId: senderId,
                balance: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: receiverWalletId,
                userId: receiverId,
                balance: 150,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        walletRepository.findById.mockResolvedValue({
            id: senderWalletId,
            userId: senderId,
            balance: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.create.mockResolvedValue({
            id: "reversal123",
            walletId: senderWalletId,
            type: TransactionType.REVERSAL,
            status: TransactionStatus.PENDING,
            amount: 100,
            originalTransactionId: transactionId,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.update
            .mockResolvedValueOnce({
                id: senderWalletId,
                userId: senderId,
                balance: 150, // 50 + 100
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: receiverWalletId,
                userId: receiverId,
                balance: 50, // 150 - 100
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        transactionRepository.update
            .mockResolvedValueOnce({
                id: transactionId,
                status: TransactionStatus.REVERSED,
            } as any)
            .mockResolvedValueOnce({
                id: "reversal123",
                status: TransactionStatus.COMPLETED,
            } as any);

        transactionRepository.findById
            .mockResolvedValueOnce(originalTransaction)
            .mockResolvedValueOnce({
                id: "reversal123",
                status: TransactionStatus.COMPLETED,
            } as any)
            .mockResolvedValueOnce({
                id: transactionId,
                status: TransactionStatus.REVERSED,
            } as any);

        const result = await useCase.execute({
            transactionId,
            userId,
            reason: "User request",
        });

        expect(result.reversalTransaction.status).toBe(TransactionStatus.COMPLETED);
        expect(walletRepository.update).toHaveBeenCalledTimes(2);
    });

    it("should throw error if transaction cannot be reversed", async () => {
        const transaction = Transaction.create({
            id: "tx123",
            walletId: "wallet123",
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING, // Não pode reverter PENDING
            amount: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        transactionRepository.findById.mockResolvedValue(transaction);

        userRepository.findById.mockResolvedValue({
            id: "user123",
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        await expect(
            useCase.execute({
                transactionId: "tx123",
                userId: "user123",
            }),
        ).rejects.toThrow(ApplicationError);
    });
});

