type SuccessCode =
  | 'USER_CREATED'
  | 'USER_AUTHENTICATED'
  | 'PROFILE_UPDATED'
  | 'ACCOUNT_DELETED'
  | 'WALLET_CREATED'
  | 'BALANCE_UPDATED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_COMPLETED'
  | 'TRANSACTION_REVERSED'
  | 'DEPOSIT_COMPLETED'
  | 'TRANSFER_COMPLETED'
  | 'OPERATION_SUCCESS';

type ErrorCode =
  | 'NO_FIELDS_TO_UPDATE'
  | 'CURRENT_PASSWORD_REQUIRED'
  | 'INVALID_EMAIL'
  | 'MISSING_USER_DATA'
  | 'USER_NOT_AUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_CURRENT_PASSWORD'
  | 'FORBIDDEN_ACTION'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_IN_USE'
  | 'EMAIL_ALREADY_USED'
  | 'WALLET_NOT_FOUND'
  | 'WALLET_ALREADY_EXISTS'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_AMOUNT'
  | 'TRANSACTION_NOT_FOUND'
  | 'TRANSACTION_CANNOT_BE_REVERSED'
  | 'TRANSACTION_ALREADY_REVERSED'
  | 'INVALID_TRANSACTION_TYPE'
  | 'INVALID_TRANSACTION_STATUS'
  | 'RECEIVER_NOT_FOUND'
  | 'CANNOT_TRANSFER_TO_SELF'
  | 'INVALID_TOKEN';

const successMessages: Record<SuccessCode, string> = {
  USER_CREATED: 'Account created successfully!',
  USER_AUTHENTICATED: 'Login successful!',
  PROFILE_UPDATED: 'Profile updated successfully.',
  ACCOUNT_DELETED: 'Account deleted successfully.',
  WALLET_CREATED: 'Wallet created successfully.',
  BALANCE_UPDATED: 'Balance updated successfully.',
  TRANSACTION_CREATED: 'Transaction created successfully.',
  TRANSACTION_COMPLETED: 'Transaction completed successfully.',
  TRANSACTION_REVERSED: 'Transaction reversed successfully.',
  DEPOSIT_COMPLETED: 'Deposit completed successfully.',
  TRANSFER_COMPLETED: 'Transfer completed successfully.',
  OPERATION_SUCCESS: 'Operation completed successfully.',
};

const errorMessages: Record<ErrorCode, string> = {
  NO_FIELDS_TO_UPDATE: 'No changes detected — no fields were updated.',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required to continue.',
  INVALID_EMAIL: 'Invalid email address.',
  MISSING_USER_DATA: 'Required user data is missing.',
  USER_NOT_AUTHENTICATED: 'User not authenticated.',
  INVALID_CREDENTIALS: 'Invalid credentials.',
  INVALID_CURRENT_PASSWORD: 'The current password is incorrect.',
  FORBIDDEN_ACTION: 'You do not have permission to perform this action.',
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_IN_USE: 'The email provided is already in use.',
  EMAIL_ALREADY_USED: 'The email provided is already in use.',
  WALLET_NOT_FOUND: 'Wallet not found.',
  WALLET_ALREADY_EXISTS: 'Wallet already exists for this user.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction.',
  INVALID_AMOUNT: 'Invalid amount. Amount must be greater than zero.',
  TRANSACTION_NOT_FOUND: 'Transaction not found.',
  TRANSACTION_CANNOT_BE_REVERSED: 'This transaction cannot be reversed.',
  TRANSACTION_ALREADY_REVERSED: 'This transaction has already been reversed.',
  INVALID_TRANSACTION_TYPE: 'Invalid transaction type.',
  INVALID_TRANSACTION_STATUS: 'Invalid transaction status.',
  RECEIVER_NOT_FOUND: 'Receiver not found.',
  CANNOT_TRANSFER_TO_SELF: 'You cannot transfer money to yourself.',
  INVALID_TOKEN: 'Invalid or expired token.',
};

export function getSuccessMessage(code: string, params?: Record<string, any>): string {
  const message = successMessages[code as SuccessCode];
  if (!message) return code;
  if (params) {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }
  return message;
}

export function getErrorMessage(code: string, params?: Record<string, any>): string {
  const message = errorMessages[code as ErrorCode];
  if (!message) return code;
  if (params) {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }
  return message;
}

export function getMessage(code: string, params?: Record<string, any>): string {
  const successMsg = successMessages[code as SuccessCode];
  if (successMsg) {
    if (params) {
      return successMsg.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match;
      });
    }
    return successMsg;
  }
  
  const errorMsg = errorMessages[code as ErrorCode];
  if (errorMsg) {
    if (params) {
      return errorMsg.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match;
      });
    }
    return errorMsg;
  }
  
  return code;
}

export function isSuccessCode(code: string): boolean {
  return code in successMessages;
}

export function isErrorCode(code: string): boolean {
  return code in errorMessages;
}

export type { SuccessCode, ErrorCode };
