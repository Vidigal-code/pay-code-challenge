"use client";

import React, {useEffect, useMemo} from "react";
import {Provider as ReduxProvider} from "react-redux";
import {store} from "../store";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {setAuthenticated} from "../store/slices/authSlice";
import {setTheme} from "../store/slices/theme.slice";
import {SESSION_COOKIE} from "../lib/config";

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[]\\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
}

export default function Providers({
    children,
    initialAuth = false,
}: {
    children: React.ReactNode;
    initialAuth?: boolean;
}) {
    const queryClient = useMemo(() => new QueryClient(), []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        
        let mounted = true;
        
        const checkAuth = () => {
            if (!mounted) return;
            const hasCookie = !!readCookie(SESSION_COOKIE);
            const isAuth = initialAuth || hasCookie;
            store.dispatch(setAuthenticated(isAuth));
        };

        checkAuth();
        
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const root = document.documentElement;
        
        if (savedTheme && mounted) {
            store.dispatch(setTheme(savedTheme));
            if (savedTheme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        } else if (mounted) {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const theme = prefersDark ? "dark" : "light";
            store.dispatch(setTheme(theme));
            if (theme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        }

        const interval = setInterval(() => {
            if (mounted) checkAuth();
        }, 2000);
        
        const handleAuthChange = () => {
            if (mounted) checkAuth();
        };
        
        window.addEventListener('auth-changed', handleAuthChange);
        
        return () => {
            mounted = false;
            clearInterval(interval);
            window.removeEventListener('auth-changed', handleAuthChange);
        };
    }, [initialAuth]);

    return (
        <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
    );
}
