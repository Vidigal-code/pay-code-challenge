export const queryKeys = {
  profile: () => ['profile'] as const,
  wallet: () => ['wallet'] as const,
  transactions: (page?: number, pageSize?: number) => ['transactions', page, pageSize] as const,
  walletKpis: () => ['wallet-kpis'] as const,
} as const;
