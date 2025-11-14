"use client";

import React, {useEffect, useMemo} from "react";
import {Provider as ReduxProvider} from "react-redux";
import {store} from "../store";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {setAuthenticated} from "../store/slices/authSlice";
import {setTheme} from "../store/slices/theme.slice";

export default function Providers({
    children,
    initialAuth = false,
}: {
    children: React.ReactNode;
    initialAuth?: boolean;
}) {
    const queryClient = useMemo(() => new QueryClient(), []);

    useEffect(() => {
        store.dispatch(setAuthenticated(Boolean(initialAuth)));
        
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            store.dispatch(setTheme(savedTheme));
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const theme = prefersDark ? "dark" : "light";
            store.dispatch(setTheme(theme));
            document.documentElement.classList.toggle("dark", theme === "dark");
        }
    }, [initialAuth]);

    return (
        <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
    );
}
