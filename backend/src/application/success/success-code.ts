export enum SuccessCode {
    // User
    USER_CREATED = "USER_CREATED",
    USER_AUTHENTICATED = "USER_AUTHENTICATED",
    PROFILE_UPDATED = "PROFILE_UPDATED",
    ACCOUNT_DELETED = "ACCOUNT_DELETED",
    
    // Wallet
    WALLET_CREATED = "WALLET_CREATED",
    BALANCE_UPDATED = "BALANCE_UPDATED",
    
    // Transaction
    TRANSACTION_CREATED = "TRANSACTION_CREATED",
    TRANSACTION_COMPLETED = "TRANSACTION_COMPLETED",
    TRANSACTION_REVERSED = "TRANSACTION_REVERSED",
    DEPOSIT_COMPLETED = "DEPOSIT_COMPLETED",
    TRANSFER_COMPLETED = "TRANSFER_COMPLETED",
    
    // Generic
    OPERATION_SUCCESS = "OPERATION_SUCCESS",
}


export class SuccessResult<T = any> {
    constructor(
        public readonly code: SuccessCode,
        public readonly data?: T,
    ) {}

    toJSON() {
        return {
            success: true,
            code: this.code,
            ...(this.data && { data: this.data }),
        };
    }
}

