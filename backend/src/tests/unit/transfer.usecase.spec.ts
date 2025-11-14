import {TransferUseCase} from "@application/use-cases/transfer.usecase";
import {WalletRepository} from "@domain/repositories/wallet.repository";
import {TransactionRepository} from "@domain/repositories/transaction.repository";
import {UserRepository} from "@domain/repositories/user.repository";
import {ApplicationError} from "@application/errors/application-error";
import {TransactionStatus} from "@domain/entities/transaction.entity";

describe("TransferUseCase", () => {
    let useCase: TransferUseCase;
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
        useCase = new TransferUseCase(walletRepository, transactionRepository, userRepository, domainEvents);
    });

    it("should transfer money successfully", async () => {
        const senderId = "sender123";
        const receiverId = "receiver123";
        const amount = 50;

        userRepository.findById
            .mockResolvedValueOnce({
                id: senderId,
                email: "sender@example.com",
                name: "Sender",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: receiverId,
                email: "receiver@example.com",
                name: "Receiver",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        walletRepository.findByUserId
            .mockResolvedValueOnce({
                id: "wallet1",
                userId: senderId,
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "wallet2",
                userId: receiverId,
                balance: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        transactionRepository.create
            .mockResolvedValueOnce({
                id: "tx1",
                walletId: "wallet1",
                senderId,
                receiverId,
                type: "TRANSFER",
                status: TransactionStatus.PENDING,
                amount,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "tx2",
                walletId: "wallet2",
                senderId,
                receiverId,
                type: "TRANSFER",
                status: TransactionStatus.COMPLETED,
                amount,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        walletRepository.update
            .mockResolvedValueOnce({
                id: "wallet1",
                userId: senderId,
                balance: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "wallet2",
                userId: receiverId,
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        transactionRepository.update.mockResolvedValue({
            id: "tx1",
            status: TransactionStatus.COMPLETED,
        } as any);
        transactionRepository.findById.mockResolvedValue({
            id: "tx1",
            status: TransactionStatus.COMPLETED,
        } as any);

        const result = await useCase.execute({senderId, receiverId, amount});

        expect(result.senderWallet.balance).toBe(50);
        expect(result.receiverWallet.balance).toBe(100);
    });

    it("should throw error for insufficient balance", async () => {
        const senderId = "sender123";
        const receiverId = "receiver123";
        const amount = 150;

        userRepository.findById
            .mockResolvedValueOnce({
                id: senderId,
                email: "sender@example.com",
                name: "Sender",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: receiverId,
                email: "receiver@example.com",
                name: "Receiver",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        walletRepository.findByUserId
            .mockResolvedValueOnce({
                id: "wallet1",
                userId: senderId,
                balance: 100, // Saldo insuficiente
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "wallet2",
                userId: receiverId,
                balance: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        await expect(
            useCase.execute({senderId, receiverId, amount}),
        ).rejects.toThrow(ApplicationError);
    });

    it("should throw error for transfer to self", async () => {
        const userId = "user123";
        const amount = 50;

        await expect(
            useCase.execute({senderId: userId, receiverId: userId, amount}),
        ).rejects.toThrow(ApplicationError);
    });

    it("should rollback on failure", async () => {
        const senderId = "sender123";
        const receiverId = "receiver123";
        const amount = 50;
        const senderPreviousBalance = 100;
        const receiverPreviousBalance = 50;

        userRepository.findById
            .mockResolvedValueOnce({
                id: senderId,
                email: "sender@example.com",
                name: "Sender",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: receiverId,
                email: "receiver@example.com",
                name: "Receiver",
                passwordHash: "hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        walletRepository.findByUserId
            .mockResolvedValueOnce({
                id: "wallet1",
                userId: senderId,
                balance: senderPreviousBalance,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "wallet2",
                userId: receiverId,
                balance: receiverPreviousBalance,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        transactionRepository.create.mockResolvedValue({
            id: "tx1",
            walletId: "wallet1",
            senderId,
            receiverId,
            type: "TRANSFER",
            status: TransactionStatus.PENDING,
            amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        // Simula falha na primeira atualização (do sender wallet)
        walletRepository.update
            .mockRejectedValueOnce(new Error("Database error"))
            .mockResolvedValueOnce({
                id: "wallet1",
                userId: senderId,
                balance: senderPreviousBalance,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .mockResolvedValueOnce({
                id: "wallet2",
                userId: receiverId,
                balance: receiverPreviousBalance,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

        await expect(useCase.execute({senderId, receiverId, amount})).rejects.toThrow();

        // Verifica rollback - verifica que ambas as chamadas de rollback foram feitas
        const updateCalls = walletRepository.update.mock.calls;
        const rollbackCalls = updateCalls.slice(1); // Pula a primeira chamada que falhou
        
        expect(rollbackCalls.length).toBeGreaterThanOrEqual(2);
        expect(rollbackCalls.some(call => 
            call[0].id === "wallet1" && call[0].balance === senderPreviousBalance
        )).toBe(true);
        expect(rollbackCalls.some(call => 
            call[0].id === "wallet2" && call[0].balance === receiverPreviousBalance
        )).toBe(true);
    });
});

