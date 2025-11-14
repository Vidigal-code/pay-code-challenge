"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SESSION_COOKIE } from "../lib/config";

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[]\\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
}

export function useAuthStatus() {
    const queryClient = useQueryClient();

    const { data: isAuthenticated = false } = useQuery({
        queryKey: ["auth-status"],
        queryFn: () => {
            const hasCookie = !!readCookie(SESSION_COOKIE);
            return hasCookie;
        },
        refetchInterval: 500, 
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0, 
    });

    const invalidateAuth = () => {
        queryClient.invalidateQueries({ queryKey: ["auth-status"] });
    };

    return {
        isAuthenticated,
        invalidateAuth,
    };
}

