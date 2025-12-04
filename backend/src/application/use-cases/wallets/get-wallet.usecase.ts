import { WalletRepository } from "@domain/repositories/wallet.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { ApplicationError } from "@application/errors/application-error";
import { Wallet } from "@domain/entities/wallet.entity";

export interface GetWalletInput {
  userId: string;
}

export class GetWalletUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetWalletInput): Promise<{ wallet: Wallet | null }> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ApplicationError("USER_NOT_FOUND");
    }

    const wallet = await this.walletRepository.findByUserId(input.userId);

    return { wallet };
  }
}
