import {Wallet} from "../entities/wallet.entity";

export interface CreateWalletInput {
    userId: string;
    balance?: number;
}

export interface UpdateWalletInput {
    id: string;
    balance: number;
}

export interface WalletRepository {
    create(data: CreateWalletInput): Promise<Wallet>;

    findByUserId(userId: string): Promise<Wallet | null>;

    findById(id: string): Promise<Wallet | null>;

    update(data: UpdateWalletInput): Promise<Wallet>;

    deleteById(id: string): Promise<void>;
}

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

