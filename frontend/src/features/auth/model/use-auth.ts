"use client";

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { authQueryKeys } from './query-keys';
import type { LoginRequest, SignupRequest } from '../api/auth.api';

export function useAuth() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: () => {
            queryClient.setQueryData(authQueryKeys.status(), true);
            queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
        },
    });

    const signupMutation = useMutation({
        mutationFn: (data: SignupRequest) => authApi.signup(data),
        onSuccess: () => {
            queryClient.setQueryData(authQueryKeys.status(), true);
            queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            queryClient.setQueryData(authQueryKeys.status(), false);
            queryClient.clear();
            router.push('/login');
        },
    });

    const login = useCallback(
        async (email: string, password: string) => {
            return loginMutation.mutateAsync({ email: email.trim(), password });
        },
        [loginMutation]
    );

    const signup = useCallback(
        async (email: string, password: string, name: string) => {
            return signupMutation.mutateAsync({ email: email.trim(), password, name: name.trim() });
        },
        [signupMutation]
    );

    const logout = useCallback(async () => {
        await logoutMutation.mutateAsync();
    }, [logoutMutation]);

    return {
        login,
        signup,
        logout,
        isLoading: loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
    };
}

