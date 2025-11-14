export interface WalletProps {
    id: string;
    userId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Wallet {
    private constructor(private props: WalletProps) {
    }

    get id(): string {
        return this.props.id;
    }

    get userId(): string {
        return this.props.userId;
    }

    get balance(): number {
        return this.props.balance;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    static create(props: WalletProps): Wallet {
        return new Wallet(props);
    }

    canWithdraw(amount: number): boolean {
        return this.props.balance >= amount;
    }

    deposit(amount: number): void {
        if (amount <= 0) {
            throw new Error("Amount must be positive");
        }
        // Se o saldo estiver negativo, o depósito adiciona ao valor atual
        this.props.balance = Number(this.props.balance) + Number(amount);
    }

    withdraw(amount: number): void {
        if (amount <= 0) {
            throw new Error("Amount must be positive");
        }
        // Allow withdrawal even if balance becomes negative (for reversals)
        // The validation should be done at use case level for normal operations
        this.props.balance = Number(this.props.balance) - Number(amount);
    }

    withdrawWithValidation(amount: number): void {
        if (amount <= 0) {
            throw new Error("Amount must be positive");
        }
        if (!this.canWithdraw(amount)) {
            throw new Error("Insufficient balance");
        }
        this.props.balance = Number(this.props.balance) - Number(amount);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            balance: Number(this.balance),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}

