"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { authQueryKeys } from './query-keys';

export function useAuthStatus() {
    const queryClient = useQueryClient();

    const { data: isAuthenticated = false, isLoading } = useQuery({
        queryKey: authQueryKeys.status(),
        queryFn: () => authApi.checkAuth(),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
        retry: false,
    });

    const invalidateAuth = () => {
        queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    };

    return {
        isAuthenticated,
        isLoading,
        invalidateAuth,
    };
}

