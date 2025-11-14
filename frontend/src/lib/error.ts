import { getErrorMessage as getErrorMessageByCode, getSuccessMessage, getMessage, isSuccessCode, isErrorCode } from './messages';

export function getErrorMessage(err: any, fallback = 'An error occurred'): string {
  if (!err) return fallback;
  const code = err?.response?.data?.code as string | undefined;
  if (code) {
    if (isErrorCode(code)) {
      return getErrorMessageByCode(code);
    }
    if (isSuccessCode(code)) {
      return getSuccessMessage(code);
    }
    return getMessage(code);
  }
  const generic = err?.response?.data?.message || err?.message || err?.toString?.();
  return typeof generic === 'string' ? generic : fallback;
}

export { getSuccessMessage, getMessage, isSuccessCode, isErrorCode };

export type EventMessage = { eventId: string; [k: string]: any };
export function getEventMessage(evt: EventMessage): string | null {
  switch (evt?.eventId) {
    case 'TRANSACTION_CREATED':
      return getSuccessMessage('TRANSACTION_CREATED');
    case 'TRANSACTION_COMPLETED':
      return getSuccessMessage('TRANSACTION_COMPLETED');
    case 'TRANSACTION_REVERSED':
      return getSuccessMessage('TRANSACTION_REVERSED');
    case 'DEPOSIT_COMPLETED':
      return getSuccessMessage('DEPOSIT_COMPLETED');
    case 'TRANSFER_COMPLETED':
      return getSuccessMessage('TRANSFER_COMPLETED');
    case 'WALLET_CREATED':
      return getSuccessMessage('WALLET_CREATED');
    case 'BALANCE_UPDATED':
      return getSuccessMessage('BALANCE_UPDATED');
    default:
      return null;
  }
}
