"use client";

import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { API_BASE } from '../config';

function readCookie(name: string) {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : undefined;
}

export const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

type TimedConfig = InternalAxiosRequestConfig & { __startedAt?: number };

apiClient.interceptors.request.use((config: TimedConfig) => {
    const csrf = readCookie('csrfToken');
    if (csrf) {
        if (!config.headers) config.headers = new AxiosHeaders();
        (config.headers as AxiosHeaders).set('X-CSRF-Token', csrf);
    }
    if (process.env.NODE_ENV !== 'test') {
        config.__startedAt = Date.now();
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<any>) => {
        const status = error.response?.status;
        const code = error.response?.data?.code as string | undefined;
        const message = error.response?.data?.message || error.message || 'REQUEST_FAILED';
        
        if (code) {
            (error as any).code = code;
        }
        if (message && typeof message === 'string') {
            (error as any).message = message;
        }

        if (typeof window !== 'undefined' && status === 401) {
            try {
                window.location.assign('/login');
            } catch {
            }
        }

        return Promise.reject(error);
    }
);

