"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useQuery, useMutation} from "@tanstack/react-query";
import {http} from "../../lib/http";
import {getErrorMessage, getSuccessMessage} from "../../lib/error";
import {useToast} from "../../hooks/useToast";
import {useAuth} from "../../hooks/useAuth";
import Skeleton from "../../components/Skeleton";
import {FiUser, FiMail, FiLock, FiTrash2, FiSave, FiCopy, FiCheck} from "react-icons/fi";

interface Profile {
    id: string;
    name: string;
    email: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const {show} = useToast();
    const {logout} = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [copied, setCopied] = useState(false);

    const profileQuery = useQuery<Profile>({
        queryKey: ["profile"],
        queryFn: async () => {
            const {data} = await http.get("/auth/profile");
            return {
                id: data.id || '',
                name: data.name || '',
                email: data.email || '',
            };
        },
    });

    useEffect(() => {
        if (profileQuery.data) {
            setName(profileQuery.data.name);
            setEmail(profileQuery.data.email);
        }
    }, [profileQuery.data]);

    const updateProfileMutation = useMutation({
        mutationFn: async (updates: {name?: string; email?: string; newPassword?: string; currentPassword?: string}) => {
            const {data} = await http.post("/auth/profile", updates);
            return data;
        },
        onSuccess: (data: any) => {
            const code = data?.code || 'PROFILE_UPDATED';
            const message = getSuccessMessage(code);
            show({type: "success", message});
            profileQuery.refetch();
            setCurrentPassword("");
            setNewPassword("");
        },
        onError: (err: any) => {
            show({type: "error", message: getErrorMessage(err, "Falha ao atualizar perfil")});
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            await http.delete("/auth/account");
        },
        onSuccess: async (data: any) => {
            const code = data?.code || 'ACCOUNT_DELETED';
            const message = getSuccessMessage(code);
            show({type: "success", message});
            await logout();
            router.push("/");
        },
        onError: (err: any) => {
            show({type: "error", message: getErrorMessage(err, "Falha ao deletar conta")});
        },
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: any = {};
        if (name !== profileQuery.data?.name) updates.name = name;
        if (email !== profileQuery.data?.email) {
            updates.email = email;
            updates.currentPassword = currentPassword;
        }
        if (newPassword) {
            updates.newPassword = newPassword;
            updates.currentPassword = currentPassword;
        }
        if (Object.keys(updates).length === 0) {
            show({type: "info", message: "Nenhuma alteração detectada"});
            return;
        }
        updateProfileMutation.mutate(updates);
    };

    const handleDeleteAccount = () => {
        if (deleteConfirm !== "DELETAR") {
            show({type: "error", message: "Digite 'DELETAR' para confirmar"});
            return;
        }
        deleteAccountMutation.mutate();
    };

    const handleCopyId = async () => {
        if (!profileQuery.data?.id) return;
        try {
            await navigator.clipboard.writeText(profileQuery.data.id);
            setCopied(true);
            show({type: "success", message: "ID copiado para a área de transferência!"});
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            show({type: "error", message: "Falha ao copiar ID"});
        }
    };

    if (profileQuery.isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
                <div className="max-w-2xl mx-auto">
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Meu Perfil
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <FiUser />
                            ID do Usuário
                        </label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white break-all">
                                {profileQuery.data?.id || 'Carregando...'}
                            </code>
                            <button
                                type="button"
                                onClick={handleCopyId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                title="Copiar ID"
                            >
                                {copied ? (
                                    <>
                                        <FiCheck className="text-lg" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <FiCopy className="text-lg" />
                                        Copiar
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            Compartilhe este ID para receber transferências
                        </p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FiUser />
                                Nome
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FiMail />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {email !== profileQuery.data?.email && (
                                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                                    Para alterar o email, você precisará informar sua senha atual
                                </p>
                            )}
                        </div>

                        {(email !== profileQuery.data?.email || newPassword) && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <FiLock />
                                    Senha Atual
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FiLock />
                                Nova Senha (opcional)
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Deixe em branco para não alterar"
                            />
                            {newPassword && (
                                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                                    Você precisará informar sua senha atual para alterar
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <FiSave />
                            {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </form>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <FiTrash2 />
                            Zona de Perigo
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Ao deletar sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Deletar Conta
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Confirmar Exclusão</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Esta ação é irreversível. Digite <strong>DELETAR</strong> para confirmar:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                            placeholder="Digite DELETAR"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteAccountMutation.isPending || deleteConfirm !== "DELETAR"}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleteAccountMutation.isPending ? "Deletando..." : "Confirmar Exclusão"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirm("");
                                }}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

