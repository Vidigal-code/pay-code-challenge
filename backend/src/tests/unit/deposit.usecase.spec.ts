import {DepositUseCase} from "@application/use-cases/deposit.usecase";
import {WalletRepository} from "@domain/repositories/wallet.repository";
import {TransactionRepository} from "@domain/repositories/transaction.repository";
import {UserRepository} from "@domain/repositories/user.repository";
import {ApplicationError} from "@application/errors/application-error";
import {TransactionStatus} from "@domain/entities/transaction.entity";

describe("DepositUseCase", () => {
    let useCase: DepositUseCase;
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

        const domainEvents = {
            publish: jest.fn().mockResolvedValue(undefined),
        } as any;
        useCase = new DepositUseCase(walletRepository, transactionRepository, userRepository, domainEvents);
    });

    it("should deposit money successfully", async () => {
        const userId = "user123";
        const amount = 100;

        userRepository.findById.mockResolvedValue({
            id: userId,
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.findByUserId.mockResolvedValue({
            id: "wallet123",
            userId,
            balance: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.create.mockResolvedValue({
            id: "tx123",
            walletId: "wallet123",
            type: "DEPOSIT",
            status: TransactionStatus.PENDING,
            amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.update.mockResolvedValue({
            id: "wallet123",
            userId,
            balance: 150,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.update.mockResolvedValue({
            id: "tx123",
            status: TransactionStatus.COMPLETED,
        } as any);
        transactionRepository.findById.mockResolvedValue({
            id: "tx123",
            status: TransactionStatus.COMPLETED,
        } as any);

        const result = await useCase.execute({userId, amount});

        expect(result.wallet.balance).toBe(150);
        expect(transactionRepository.create).toHaveBeenCalled();
        expect(walletRepository.update).toHaveBeenCalled();
    });

    it("should throw error for invalid amount", async () => {
        await expect(
            useCase.execute({userId: "user123", amount: -10}),
        ).rejects.toThrow(ApplicationError);
    });

    it("should add to negative balance", async () => {
        const userId = "user123";
        const amount = 100;

        userRepository.findById.mockResolvedValue({
            id: userId,
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.findByUserId.mockResolvedValue({
            id: "wallet123",
            userId,
            balance: -50, 
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.create.mockResolvedValue({
            id: "tx123",
            walletId: "wallet123",
            type: "DEPOSIT",
            status: TransactionStatus.PENDING,
            amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.update.mockResolvedValue({
            id: "wallet123",
            userId,
            balance: 50, // -50 + 100 = 50
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.update.mockResolvedValue({
            id: "tx123",
            status: TransactionStatus.COMPLETED,
        } as any);
        transactionRepository.findById.mockResolvedValue({
            id: "tx123",
            status: TransactionStatus.COMPLETED,
        } as any);

        const result = await useCase.execute({userId, amount});

        expect(result.wallet.balance).toBe(50);
    });

    it("should rollback on failure", async () => {
        const userId = "user123";
        const amount = 100;
        const previousBalance = 50;

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        userRepository.findById.mockResolvedValue({
            id: userId,
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.findByUserId.mockResolvedValue({
            id: "wallet123",
            userId,
            balance: previousBalance,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        transactionRepository.create.mockResolvedValue({
            id: "tx123",
            walletId: "wallet123",
            type: "DEPOSIT",
            status: TransactionStatus.PENDING,
            amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        walletRepository.update.mockRejectedValue(new Error("Database error"));

        await expect(useCase.execute({userId, amount})).rejects.toThrow();

        expect(walletRepository.update).toHaveBeenCalledWith({
            id: "wallet123",
            balance: previousBalance,
        });
        expect(transactionRepository.update).toHaveBeenCalledWith({
            id: "tx123",
            status: TransactionStatus.FAILED,
        });

        consoleErrorSpy.mockRestore();
    });
});

