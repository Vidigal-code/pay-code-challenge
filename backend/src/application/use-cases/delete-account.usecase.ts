import { UserRepository } from "@domain/repositories/user.repository";
import { WalletRepository } from "@domain/repositories/wallet.repository";
import { TransactionRepository } from "@domain/repositories/transaction.repository";
import { ApplicationError } from "@application/errors/application-error";

export interface DeleteAccountInput {
  userId: string;
}

export class DeleteAccountUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const wallet = await this.walletRepository.findByUserId(input.userId);
    if (wallet) {
      const transactions = await this.transactionRepository.list({
        userId: input.userId,
      });

      // Em produção, você pode querer soft delete ou arquivar transações
      // Por simplicidade, vamos apenas deletar a wallet
      // As transações podem ser mantidas para auditoria
      await this.walletRepository.deleteById(wallet.id);
    }

    // Deletar usuário
    await this.userRepository.deleteById(input.userId);
  }
}
