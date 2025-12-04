export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  TRANSFER = "TRANSFER",
  REVERSAL = "REVERSAL",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REVERSED = "REVERSED",
  FAILED = "FAILED",
}

export interface TransactionProps {
  id: string;
  walletId: string;
  senderId?: string | null;
  receiverId?: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description?: string | null;
  reversedById?: string | null;
  reversedAt?: Date | null;
  originalTransactionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  private constructor(private props: TransactionProps) {}

  get id(): string {
    return this.props.id;
  }

  get walletId(): string {
    return this.props.walletId;
  }

  get senderId(): string | null | undefined {
    return this.props.senderId;
  }

  get receiverId(): string | null | undefined {
    return this.props.receiverId;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get amount(): number {
    return this.props.amount;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get reversedById(): string | null | undefined {
    return this.props.reversedById;
  }

  get reversedAt(): Date | null | undefined {
    return this.props.reversedAt;
  }

  get originalTransactionId(): string | null | undefined {
    return this.props.originalTransactionId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  canBeReversed(): boolean {
    return (
      this.props.status === TransactionStatus.COMPLETED &&
      this.props.type !== TransactionType.REVERSAL &&
      !this.props.originalTransactionId
    );
  }

  markAsCompleted(): void {
    this.props.status = TransactionStatus.COMPLETED;
  }

  markAsReversed(reversedById: string): void {
    this.props.status = TransactionStatus.REVERSED;
    this.props.reversedById = reversedById;
    this.props.reversedAt = new Date();
  }

  markAsFailed(): void {
    this.props.status = TransactionStatus.FAILED;
  }

  toJSON() {
    return {
      id: this.id,
      walletId: this.walletId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      type: this.type,
      status: this.status,
      amount: Number(this.amount),
      description: this.description,
      reversedById: this.reversedById,
      reversedAt: this.reversedAt?.toISOString(),
      originalTransactionId: this.originalTransactionId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
