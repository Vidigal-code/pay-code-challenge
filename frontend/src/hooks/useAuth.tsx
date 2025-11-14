"use client";

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '../store';
import { setAuthenticated, logoutState } from '../store/slices/authSlice';
import { http } from '../lib/http';

export function useAuth() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await http.post('/auth/login', { email: email.trim(), password });
        dispatch(setAuthenticated(true));
        // Invalidate auth query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["auth-status"] });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-changed'));
        }
        return data;
    }, [dispatch, queryClient]);

    const signup = useCallback(async (email: string, password: string, name: string) => {
        const { data } = await http.post('/auth/signup', { email: email.trim(), password, name: name.trim() });
        dispatch(setAuthenticated(true));
        // Invalidate auth query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["auth-status"] });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-changed'));
        }
        return data;
    }, [dispatch, queryClient]);

    const logout = useCallback(async () => {
        try { await fetch('/api/logout', { method: 'POST' }); } catch {}
        dispatch(logoutState());
        // Invalidate auth query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["auth-status"] });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-changed'));
            window.location.assign('/login');
        }
    }, [dispatch, queryClient]);

    return { isAuthenticated, login, signup, logout, setAuthenticated: (v: boolean) => dispatch(setAuthenticated(v)) };
}
