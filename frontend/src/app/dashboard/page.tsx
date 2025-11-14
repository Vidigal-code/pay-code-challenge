"use client";

import {useRouter} from "next/navigation";
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {http} from "../../lib/http";
import {getErrorMessage} from "../../lib/error";
import {useToast} from "../../hooks/useToast";
import Skeleton from "../../components/Skeleton";
import {FiArrowRight, FiTrendingUp, FiDollarSign, FiSend, FiDownload} from "react-icons/fi";

interface DashboardKPIs {
    totalBalance: number;
    totalDeposits: number;
    totalTransfers: number;
    totalReceived: number;
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    reversedTransactions: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const {show} = useToast();

    const kpisQuery = useQuery<{kpis: DashboardKPIs}>({
        queryKey: ["wallet-kpis"],
        queryFn: async () => {
            try {
                const {data} = await http.get("/wallet/dashboard/kpis");
                return data.kpis !== undefined ? { kpis: data.kpis } : data;
            } catch (err) {
                show({type: "error", message: getErrorMessage(err, "Falha ao carregar indicadores")});
                throw err;
            }
        },
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"}).format(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard Financeiro
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Acompanhe suas métricas financeiras em tempo real
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        href="/wallet"
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="text-2xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Carteira</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ver saldo e transações</p>
                            </div>
                        </div>
                        <FiArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    <Link
                        href="/wallet?action=deposit"
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <FiDownload className="text-2xl text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Depositar</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Adicionar fundos</p>
                            </div>
                        </div>
                        <FiArrowRight className="text-gray-400 group-hover:text-green-600 transition-colors" />
                    </Link>

                    <Link
                        href="/wallet?action=transfer"
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <FiSend className="text-2xl text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Transferir</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Enviar dinheiro</p>
                            </div>
                        </div>
                        <FiArrowRight className="text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </Link>
                </div>

                {kpisQuery.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : kpisQuery.data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Saldo Total</h3>
                                <FiTrendingUp className="text-2xl opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{formatCurrency(kpisQuery.data.kpis.totalBalance)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Total Depósitos</h3>
                                <FiDownload className="text-2xl opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{formatCurrency(kpisQuery.data.kpis.totalDeposits)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Total Enviado</h3>
                                <FiSend className="text-2xl opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{formatCurrency(kpisQuery.data.kpis.totalTransfers)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Total Recebido</h3>
                                <FiDollarSign className="text-2xl opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{formatCurrency(kpisQuery.data.kpis.totalReceived)}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total de Transações</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpisQuery.data.kpis.totalTransactions}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700">
                            <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Completadas</h3>
                            <p className="text-3xl font-bold text-green-900 dark:text-green-300">{kpisQuery.data.kpis.completedTransactions}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-700">
                            <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Falhadas</h3>
                            <p className="text-3xl font-bold text-red-900 dark:text-red-300">{kpisQuery.data.kpis.failedTransactions}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-orange-200 dark:border-orange-700">
                            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Revertidas</h3>
                            <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">{kpisQuery.data.kpis.reversedTransactions}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

