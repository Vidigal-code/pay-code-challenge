"use client";

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { authQueryKeys } from './query-keys';

const AUTH_HINT_STORAGE_KEY = 'paycode_auth_hint';

const readAuthHint = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTH_HINT_STORAGE_KEY) === 'true';
};

export function useAuthStatus(initialAuth = false) {
    const queryClient = useQueryClient();
    const [shouldCheckServer, setShouldCheckServer] = useState(initialAuth);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncAuthHint = () => {
            setShouldCheckServer(readAuthHint() || initialAuth);
        };

        if (initialAuth) {
            window.localStorage.setItem(AUTH_HINT_STORAGE_KEY, 'true');
        }

        syncAuthHint();
        window.addEventListener('auth-changed', syncAuthHint);

        return () => {
            window.removeEventListener('auth-changed', syncAuthHint);
        };
    }, [initialAuth]);

    const {
        data: isAuthenticated = initialAuth,
        isLoading,
    } = useQuery({
        queryKey: authQueryKeys.status(),
        queryFn: () => authApi.checkAuth(),
        enabled: shouldCheckServer,
        refetchOnWindowFocus: shouldCheckServer,
        refetchOnMount: shouldCheckServer,
        staleTime: 0,
        retry: false,
        initialData: initialAuth,
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

