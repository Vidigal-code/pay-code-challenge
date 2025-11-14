import {WalletRepository} from "@domain/repositories/wallet.repository";
import {UserRepository} from "@domain/repositories/user.repository";
import {ApplicationError} from "@application/errors/application-error";
import {Wallet} from "@domain/entities/wallet.entity";

export interface CreateWalletInput {
    userId: string;
}

export class CreateWalletUseCase {
    constructor(
        private readonly walletRepository: WalletRepository,
        private readonly userRepository: UserRepository,
    ) {
    }

    async execute(input: CreateWalletInput): Promise<{wallet: Wallet}> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new ApplicationError("USER_NOT_FOUND");
        }

        const existingWallet = await this.walletRepository.findByUserId(input.userId);
        if (existingWallet) {
            throw new ApplicationError("WALLET_ALREADY_EXISTS");
        }

        const wallet = await this.walletRepository.create({
            userId: input.userId,
            balance: 0,
        });

        return {wallet};
    }
}

