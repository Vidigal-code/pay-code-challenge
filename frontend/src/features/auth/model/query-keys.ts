export const authQueryKeys = {
    all: ['auth'] as const,
    status: () => [...authQueryKeys.all, 'status'] as const,
    profile: () => [...authQueryKeys.all, 'profile'] as const,
};

