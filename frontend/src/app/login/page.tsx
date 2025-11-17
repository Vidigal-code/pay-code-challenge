"use client";

import React, {useState} from "react";
import { useAuth } from "@/features/auth/model/use-auth";
import {useToast} from "../../hooks/useToast";
import {useRouter} from "next/navigation";
import {getErrorMessage, getSuccessMessage} from "../../lib/error";
import Link from "next/link";
import {FiMail, FiLock, FiArrowRight, FiShield} from "react-icons/fi";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const {show} = useToast();
    const { login: loginAction, isLoading: isLoginLoading } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50
        via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r
                        from-blue-600 to-purple-600 rounded-full mb-4">
                            <FiShield className="text-3xl text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Entre na sua conta PAYCODE</p>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);
                            try {
                                await loginAction(email.trim(), password);
                                show({type: "success", message: "Login realizado com sucesso"});
                                router.push("/dashboard");
                            } catch (err) {
                                const m = getErrorMessage(err, "Falha no login");
                                show({type: "error", message: m});
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FiMail />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3 border border-gray-300
                                dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700
                                text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium
                            text-gray-700 dark:text-gray-300 mb-2">
                                <FiLock />
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                                rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2
                                focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isLoginLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold
                             hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center
                              justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                "Entrando..."
                            ) : (
                                <>
                                    Entrar
                                    <FiArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Não tem conta?{" "}
                            <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
