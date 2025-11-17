import { apiClient } from '@/shared/api/client';
import type { User } from '../model/types';

export interface ProfileResponse {
    id: string;
    email: string;
    name: string;
}

export const userApi = {
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<ProfileResponse>('/auth/profile');
        return response.data;
    },
};

