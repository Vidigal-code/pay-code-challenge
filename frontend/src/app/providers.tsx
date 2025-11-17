"use client";

import React, {useEffect, useMemo} from "react";
import {Provider as ReduxProvider} from "react-redux";
import {store} from "../store";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {setTheme} from "../store/slices/theme.slice";


export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = useMemo(() => new QueryClient(), []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const root = document.documentElement;
        
        if (savedTheme) {
            store.dispatch(setTheme(savedTheme));
            if (savedTheme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const theme = prefersDark ? "dark" : "light";
            store.dispatch(setTheme(theme));
            if (theme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        }
    }, []);

    return (
        <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
    );
}
