import { apiClient } from '@/shared/api/client';
import type { User } from '@/entities/user/model/types';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginResponse {
    id: string;
    email: string;
    name: string;
}

export interface SignupResponse {
    id: string;
    email: string;
    name: string;
}

export interface ProfileResponse {
    id: string;
    email: string;
    name: string;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', data);
        return response.data;
    },

    signup: async (data: SignupRequest): Promise<SignupResponse> => {
        const response = await apiClient.post<SignupResponse>('/auth/signup', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await fetch('/api/logout', { method: 'POST' });
    },

    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get<ProfileResponse>('/auth/profile');
        return response.data;
    },

    checkAuth: async (): Promise<boolean> => {
        try {
            await apiClient.get('/auth/profile');
            return true;
        } catch {
            return false;
        }
    },
};

