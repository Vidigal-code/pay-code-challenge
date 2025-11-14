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
  | 'INVALID_DATE'
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
  USER_CREATED: 'Conta criada com sucesso!',
  USER_AUTHENTICATED: 'Login realizado com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso.',
  ACCOUNT_DELETED: 'Conta deletada com sucesso.',
  WALLET_CREATED: 'Carteira criada com sucesso.',
  BALANCE_UPDATED: 'Saldo atualizado com sucesso.',
  TRANSACTION_CREATED: 'Transação criada com sucesso.',
  TRANSACTION_COMPLETED: 'Transação concluída com sucesso.',
  TRANSACTION_REVERSED: 'Transação revertida com sucesso.',
  DEPOSIT_COMPLETED: 'Depósito concluído com sucesso.',
  TRANSFER_COMPLETED: 'Transferência concluída com sucesso.',
  OPERATION_SUCCESS: 'Operação concluída com sucesso.',
};

const errorMessages: Record<ErrorCode, string> = {
  NO_FIELDS_TO_UPDATE: 'Nenhuma alteração detectada — nenhum campo foi atualizado.',
  CURRENT_PASSWORD_REQUIRED: 'A senha atual é necessária para continuar.',
  INVALID_EMAIL: 'Endereço de email inválido.',
  MISSING_USER_DATA: 'Dados do usuário obrigatórios estão faltando.',
  INVALID_DATE: 'Data inválida.',
  USER_NOT_AUTHENTICATED: 'Usuário não autenticado.',
  INVALID_CREDENTIALS: 'Credenciais inválidas.',
  INVALID_CURRENT_PASSWORD: 'A senha atual está incorreta.',
  FORBIDDEN_ACTION: 'Você não tem permissão para realizar esta ação.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  EMAIL_ALREADY_IN_USE: 'O email fornecido já está em uso.',
  EMAIL_ALREADY_USED: 'O email fornecido já está em uso.',
  WALLET_NOT_FOUND: 'Carteira não encontrada.',
  WALLET_ALREADY_EXISTS: 'Carteira já existe para este usuário.',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente para completar esta transação.',
  INVALID_AMOUNT: 'Valor inválido. O valor deve ser maior que zero.',
  TRANSACTION_NOT_FOUND: 'Transação não encontrada.',
  TRANSACTION_CANNOT_BE_REVERSED: 'Esta transação não pode ser revertida.',
  TRANSACTION_ALREADY_REVERSED: 'Esta transação já foi revertida.',
  INVALID_TRANSACTION_TYPE: 'Tipo de transação inválido.',
  INVALID_TRANSACTION_STATUS: 'Status de transação inválido.',
  RECEIVER_NOT_FOUND: 'Destinatário não encontrado.',
  CANNOT_TRANSFER_TO_SELF: 'Você não pode transferir dinheiro para si mesmo.',
  INVALID_TOKEN: 'Token inválido ou expirado.',
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
