"use client";
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { http } from '@/lib/http';
import { getErrorMessage, getSuccessMessage } from '@/lib/error';
import { useToast } from '@/hooks/useToast';
import Skeleton from '../../components/Skeleton';
import { formatDate } from '@/lib/date-utils';

export interface Wallet {
    id: string;
    userId: string;
    balance: number;
}


export type TransactionType =
    | 'DEPOSIT'
    | 'TRANSFER'
    | 'REVERSAL';

export type TransactionStatus =
    | 'PENDING'
    | 'COMPLETED'
    | 'REVERSED'
    | 'FAILED';


export interface TransactionParticipant {
    id: string;
    name: string;
    email: string;
}


export interface Transaction {
    id: string;
    walletId: string;

    senderId?: string;
    receiverId?: string;

    type: TransactionType;
    status: TransactionStatus;

    amount: number;
    description?: string;
    createdAt: string;

    sender?: TransactionParticipant;
    receiver?: TransactionParticipant;
}

export interface DashboardKPIs {
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
    const [showReverseModal, setShowReverseModal] = useState(false);
    const [reverseReason, setReverseReason] = useState('');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

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

    const profileQuery = useQuery<{ id: string; name: string; email: string }>({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data } = await http.get('/auth/profile');
            return data;
        },
    });

    const depositMutation = useMutation({
        mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
            const { data } = await http.post('/wallet/deposit', { 
                amount: Number(amount), 
                description: description || undefined 
            });
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
            show({ type: 'error', message: getErrorMessage(err, 'Falha ao depositar') });
        },
    });

    const transferMutation = useMutation({
        mutationFn: async ({ receiverId, amount, description }: { receiverId: string; amount: number; description?: string }) => {
            const { data } = await http.post('/wallet/transfer', { 
                receiverId, 
                amount: Number(amount), 
                description: description || undefined 
            });
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
            show({ type: 'error', message: getErrorMessage(err, 'Falha ao transferir') });
        },
    });

    const reverseMutation = useMutation({
        mutationFn: async ({ transactionId, reason }: { transactionId: string; reason?: string }) => {
            const { data } = await http.post(`/wallet/transactions/${transactionId}/reverse`, { reason });
            return data;
        },
        onSuccess: (data: any) => {
            const code = data?.code || 'TRANSACTION_REVERSED';
            const message = getSuccessMessage(code);
            show({ type: 'success', message });
            setShowReverseModal(false);
            setReverseReason('');
            setSelectedTransactionId(null);
            walletQuery.refetch();
            transactionsQuery.refetch();
            kpisQuery.refetch();
        },
        onError: (err: any) => {
            show({ type: 'error', message: getErrorMessage(err, 'Falha ao reverter transação') });
        },
    });

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            show({ type: 'error', message: 'Valor inválido. O valor deve ser maior que zero.' });
            return;
        }
        if (amount < 0.01) {
            show({ type: 'error', message: 'O valor mínimo para depósito é R$ 0,01' });
            return;
        }
        depositMutation.mutate({ amount: Number(amount.toFixed(2)), description: depositDescription || undefined });
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            show({ type: 'error', message: 'Valor inválido' });
            return;
        }
        if (amount < 0.01) {
            show({ type: 'error', message: 'O valor mínimo para transferência é R$ 0,01' });
            return;
        }
        if (!transferReceiverId.trim()) {
            show({ type: 'error', message: 'ID do destinatário é obrigatório' });
            return;
        }
        
        const transferAmountNum = Number(amount.toFixed(2));
        
        transferMutation.mutate({ receiverId: transferReceiverId.trim(), amount: transferAmountNum, description: transferDescription || undefined });
    };

    const handleReverseClick = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setShowReverseModal(true);
    };

    const handleReverse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTransactionId) return;
        reverseMutation.mutate({ 
            transactionId: selectedTransactionId, 
            reason: reverseReason || undefined 
        });
    };

    const canReverseTransaction = (tx: Transaction) => {
        return tx.status === 'COMPLETED' && 
               (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER');
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined || isNaN(value)) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    };

    const profileId = profileQuery.data?.id;

    const transactionTypeLabels: Record<TransactionType, string> = {
        DEPOSIT: 'Depósito',
        TRANSFER: 'Transferência',
        REVERSAL: 'Reversão',
    };

    const transactionStatusLabels: Record<TransactionStatus, string> = {
        PENDING: 'Pendente',
        COMPLETED: 'Concluída',
        REVERSED: 'Revertida',
        FAILED: 'Falhou',
    };

    const isCreditTransaction = (tx: Transaction) => {
        if (tx.type === 'DEPOSIT') {
            return true;
        }

        if (tx.type === 'TRANSFER') {
            if (profileId) {
                if (tx.receiverId === profileId) return true;
                if (tx.senderId === profileId) return false;
            }
            return tx.amount >= 0;
        }

        if (tx.type === 'REVERSAL') {
            if (profileId) {
                if (tx.receiverId === profileId) return true;
                if (tx.senderId === profileId) return false;
            }
            return tx.amount >= 0;
        }

        return tx.amount >= 0;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Carteira PAYCODE</h1>

            {kpisQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : kpisQuery.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Saldo Total</h3>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(kpisQuery.data.kpis.totalBalance)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Total de Depósitos</h3>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(kpisQuery.data.kpis.totalDeposits)}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">Total de Transferências</h3>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(kpisQuery.data.kpis.totalTransfers)}</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">Total Recebido</h3>
                        <p className="text-2xl font-bold text-yellow-900">{formatCurrency(kpisQuery.data.kpis.totalReceived)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Total de Transações</h3>
                        <p className="text-2xl font-bold text-gray-900">{kpisQuery.data.kpis.totalTransactions}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Completadas</h3>
                        <p className="text-2xl font-bold text-green-900">{kpisQuery.data.kpis.completedTransactions}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Falhadas</h3>
                        <p className="text-2xl font-bold text-red-900">{kpisQuery.data.kpis.failedTransactions}</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">Revertidas</h3>
                        <p className="text-2xl font-bold text-orange-900">{kpisQuery.data.kpis.reversedTransactions}</p>
                    </div>
                </div>
            )}

            {walletQuery.isLoading ? (
                <Skeleton className="h-24" />
            ) : (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Minha Carteira</h2>
                    <p className="text-3xl font-bold text-blue-600">
                        {walletQuery.data?.wallet?.balance !== undefined && walletQuery.data?.wallet?.balance !== null 
                            ? formatCurrency(walletQuery.data.wallet.balance) 
                            : formatCurrency(0)}
                    </p>
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                    Depositar
                </button>
                <button
                    onClick={() => setShowTransferModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Transferir
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Transações Recentes</h2>
                {transactionsQuery.isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                ) : transactionsQuery.data && transactionsQuery.data.transactions.length > 0 ? (
                    <div className="space-y-2">
                        {transactionsQuery.data.transactions.map((tx) => {
                            const isCredit = isCreditTransaction(tx);
                            return (
                            <div key={tx.id} className="border p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-medium">{transactionTypeLabels[tx.type] ?? tx.type}</p>
                                        <p className="text-sm text-gray-600">{tx.description || 'Sem descrição'}</p>
                                        {tx.type === 'TRANSFER' && tx.sender && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                De: {tx.sender.name} ({tx.sender.email})
                                            </p>
                                        )}
                                        {tx.type === 'TRANSFER' && tx.receiver && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Para: {tx.receiver.name} ({tx.receiver.email})
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                {isCredit ? '+' : '-'}
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <p className={`text-sm ${tx.status === 'COMPLETED' ? 'text-green-600' : tx.status === 'FAILED' ? 'text-red-600' : tx.status === 'REVERSED' ? 'text-orange-600' : 'text-yellow-600'}`}>
                                                {transactionStatusLabels[tx.status] ?? tx.status}
                                            </p>
                                        </div>
                                        {canReverseTransaction(tx) && (
                                            <button
                                                onClick={() => handleReverseClick(tx.id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                                title="Reverter transação"
                                            >
                                                Reverter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                ) : (
                    <p className="text-gray-500">Nenhuma transação ainda</p>
                )}
            </div>

            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Depositar Dinheiro</h3>
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div>
                                <label htmlFor="deposit-amount" className="block text-sm font-medium mb-1">Valor</label>
                                <input
                                    id="deposit-amount"
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
                                <label htmlFor="deposit-description" className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                                <input
                                    id="deposit-description"
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
                                    {depositMutation.isPending ? 'Processando...' : 'Depositar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Transferir Dinheiro</h3>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label htmlFor="transfer-receiver-id" className="block text-sm font-medium mb-1">ID ou Email do Destinatário</label>
                                <input
                                    id="transfer-receiver-id"
                                    type="text"
                                    placeholder="Digite o ID ou email do destinatário"
                                    value={transferReceiverId}
                                    onChange={(e) => setTransferReceiverId(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Você pode usar o ID do usuário ou o email</p>
                            </div>
                            <div>
                                <label htmlFor="transfer-amount" className="block text-sm font-medium mb-1">Valor</label>
                                <input
                                    id="transfer-amount"
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
                                <label htmlFor="transfer-description" className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                                <input
                                    id="transfer-description"
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
                                    {transferMutation.isPending ? 'Processando...' : 'Transferir'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReverseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Reverter Transação</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Tem certeza que deseja reverter esta transação? Esta ação não pode ser desfeita.
                        </p>
                        <form onSubmit={handleReverse} className="space-y-4">
                            <div>
                                <label htmlFor="reverse-reason" className="block text-sm font-medium mb-1">Motivo (opcional)</label>
                                <textarea
                                    id="reverse-reason"
                                    value={reverseReason}
                                    onChange={(e) => setReverseReason(e.target.value)}
                                    className="border px-3 py-2 w-full rounded"
                                    rows={3}
                                    placeholder="Digite o motivo da reversão..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={reverseMutation.isPending}
                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                    {reverseMutation.isPending ? 'Processando...' : 'Confirmar Reversão'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReverseModal(false);
                                        setReverseReason('');
                                        setSelectedTransactionId(null);
                                    }}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

