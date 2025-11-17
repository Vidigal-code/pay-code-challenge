"use client";

import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { userQueryKeys } from './query-keys';

export function useProfile() {
    return useQuery({
        queryKey: userQueryKeys.profile(),
        queryFn: () => userApi.getProfile(),
        enabled: false,
    });
}

