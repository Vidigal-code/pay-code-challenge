"use client";
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { getErrorMessage, getSuccessMessage } from '../../lib/error';
import { useToast } from '../../hooks/useToast';
import Skeleton from '../../components/Skeleton';

interface Wallet {
    id: string;
    userId: string;
    balance: number;
}

interface Transaction {
    id: string;
    walletId: string;
    senderId?: string;
    receiverId?: string;
    type: 'DEPOSIT' | 'TRANSFER' | 'REVERSAL';
    status: 'PENDING' | 'COMPLETED' | 'REVERSED' | 'FAILED';
    amount: number;
    description?: string;
    createdAt: string;
}

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

export default function WalletPage() {
    const { show } = useToast();
    const [depositAmount, setDepositAmount] = useState('');
    const [depositDescription, setDepositDescription] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferReceiverId, setTransferReceiverId] = useState('');
    const [transferDescription, setTransferDescription] = useState('');
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    const walletQuery = useQuery<{ wallet: Wallet | null }>({
        queryKey: ['wallet'],
        queryFn: async () => {
            const { data } = await http.get('/wallet');
            return data.wallet !== undefined ? { wallet: data.wallet } : data;
        },
    });

    const transactionsQuery = useQuery<{ transactions: Transaction[]; total: number; page: number; pageSize: number }>({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data } = await http.get('/wallet/transactions', { params: { page: 1, pageSize: 10 } });
            return {
                transactions: data.transactions || [],
                total: data.total || 0,
                page: data.page || 1,
                pageSize: data.pageSize || 10,
            };
        },
    });

    const kpisQuery = useQuery<{ kpis: DashboardKPIs }>({
        queryKey: ['wallet-kpis'],
        queryFn: async () => {
            const { data } = await http.get('/wallet/dashboard/kpis');
            return data.kpis !== undefined ? { kpis: data.kpis } : data;
        },
    });

    const depositMutation = useMutation({
        mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
            const { data } = await http.post('/wallet/deposit', { amount, description });
            return data;
        },
        onSuccess: (data: any) => {
            const code = data?.code || 'DEPOSIT_COMPLETED';
            const message = getSuccessMessage(code);
            show({ type: 'success', message });
            setShowDepositModal(false);
            setDepositAmount('');
            setDepositDescription('');
            walletQuery.refetch();
            transactionsQuery.refetch();
            kpisQuery.refetch();
        },
        onError: (err: any) => {
            show({ type: 'error', message: getErrorMessage(err, 'Failed to deposit') });
        },
    });

    const transferMutation = useMutation({
        mutationFn: async ({ receiverId, amount, description }: { receiverId: string; amount: number; description?: string }) => {
            const { data } = await http.post('/wallet/transfer', { receiverId, amount, description });
            return data;
        },
        onSuccess: (data: any) => {
            const code = data?.code || 'TRANSFER_COMPLETED';
            const message = getSuccessMessage(code);
            show({ type: 'success', message });
            setShowTransferModal(false);
            setTransferAmount('');
            setTransferReceiverId('');
            setTransferDescription('');
            walletQuery.refetch();
            transactionsQuery.refetch();
            kpisQuery.refetch();
        },
        onError: (err: any) => {
            show({ type: 'error', message: getErrorMessage(err, 'Failed to transfer') });
        },
    });

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            show({ type: 'error', message: 'Invalid amount' });
            return;
        }
        depositMutation.mutate({ amount, description: depositDescription || undefined });
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            show({ type: 'error', message: 'Invalid amount' });
            return;
        }
        if (!transferReceiverId.trim()) {
            show({ type: 'error', message: 'Receiver ID is required' });
            return;
        }
        transferMutation.mutate({ receiverId: transferReceiverId, amount, description: transferDescription || undefined });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">PAYCODE Wallet</h1>

            {kpisQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : kpisQuery.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Balance</h3>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(kpisQuery.data.kpis.totalBalance)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Total Deposits</h3>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(kpisQuery.data.kpis.totalDeposits)}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">Total Transfers</h3>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(kpisQuery.data.kpis.totalTransfers)}</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">Total Received</h3>
                        <p className="text-2xl font-bold text-yellow-900">{formatCurrency(kpisQuery.data.kpis.totalReceived)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transactions</h3>
                        <p className="text-2xl font-bold text-gray-900">{kpisQuery.data.kpis.totalTransactions}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Completed</h3>
                        <p className="text-2xl font-bold text-green-900">{kpisQuery.data.kpis.completedTransactions}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Failed</h3>
                        <p className="text-2xl font-bold text-red-900">{kpisQuery.data.kpis.failedTransactions}</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">Reversed</h3>
                        <p className="text-2xl font-bold text-orange-900">{kpisQuery.data.kpis.reversedTransactions}</p>
                    </div>
                </div>
            )}

            {walletQuery.isLoading ? (
                <Skeleton className="h-24" />
            ) : walletQuery.data && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">My Wallet</h2>
                    <p className="text-3xl font-bold text-blue-600">
                        {walletQuery.data.wallet ? formatCurrency(walletQuery.data.wallet.balance) : formatCurrency(0)}
                    </p>
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                    Deposit
                </button>
                <button
                    onClick={() => setShowTransferModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Transfer
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                {transactionsQuery.isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                ) : transactionsQuery.data && transactionsQuery.data.transactions.length > 0 ? (
                    <div className="space-y-2">
                        {transactionsQuery.data.transactions.map((tx) => (
                            <div key={tx.id} className="border p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{tx.type}</p>
                                        <p className="text-sm text-gray-600">{tx.description || 'No description'}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.receiverId) ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.receiverId) ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </p>
                                        <p className={`text-sm ${tx.status === 'COMPLETED' ? 'text-green-600' : tx.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No transactions yet</p>
                )}
            </div>

            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Deposit Money</h3>
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                <input
                                    type="text"
                                    value={depositDescription}
                                    onChange={(e) => setDepositDescription(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={depositMutation.isPending}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    {depositMutation.isPending ? 'Processing...' : 'Deposit'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Transfer Money</h3>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Receiver ID</label>
                                <input
                                    type="text"
                                    value={transferReceiverId}
                                    onChange={(e) => setTransferReceiverId(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                <input
                                    type="text"
                                    value={transferDescription}
                                    onChange={(e) => setTransferDescription(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={transferMutation.isPending}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {transferMutation.isPending ? 'Processing...' : 'Transfer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

