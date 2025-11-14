import "./globals.css";
import React from "react";
import {ToastProvider} from "../contexts/ToastContext";
import Providers from "./providers";
import {ToastContainer} from "../components/ui/Toast";
import Navbar from "../components/Navbar";

export const metadata = {
    title: "PAYCODE - Fintech Wallet Platform",
    description: "Sua carteira digital segura e moderna",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <Providers>
                    <ToastProvider>
                        <Navbar />
                        <main>{children}</main>
                        <ToastContainer />
                    </ToastProvider>
                </Providers>
            </body>
        </html>
    );
}
