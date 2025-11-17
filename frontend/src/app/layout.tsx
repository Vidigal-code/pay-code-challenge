import "./globals.css";
import React from "react";
import {ToastProvider} from "../contexts/ToastContext";
import Providers from "./providers";
import {ToastContainer} from "../components/ui/Toast";
import { Navbar } from "@/widgets/navbar";
import {cookies} from "next/headers";
import { SESSION_COOKIE } from "@/shared/config";

export const metadata = {
    title: "PAYCODE - Fintech Wallet Platform",
    description: "Sua carteira digital segura e moderna",
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    const initialAuth = Boolean(sessionCookie?.value);

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    const root = document.documentElement;
                                    if (theme === 'dark') {
                                        root.classList.add('dark');
                                    } else {
                                        root.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" suppressHydrationWarning>
                <Providers>
                    <ToastProvider>
                        <Navbar />
                        <main suppressHydrationWarning>{children}</main>
                        <ToastContainer />
                    </ToastProvider>
                </Providers>
            </body>
        </html>
    );
}
