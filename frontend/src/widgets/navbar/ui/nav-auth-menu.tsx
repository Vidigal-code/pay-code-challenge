"use client";

import Link from 'next/link';
import { useAuth } from '@/features/auth/model/use-auth';
import { useAuthStatus } from '@/features/auth/model/use-auth-status';
import { FiLayout, FiCreditCard, FiUser, FiLogOut, FiLogIn, FiUserPlus } from 'react-icons/fi';

export function NavAuthMenu({ initialAuth }: { initialAuth: boolean }) {
    const { isAuthenticated } = useAuthStatus();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    const shouldShowAuth = isAuthenticated || initialAuth;

    return (
        <div className="flex items-center gap-4">
            {shouldShowAuth ? (
                <>
                    <Link
                        href="/dashboard"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                        <FiLayout className="text-lg" />
                        Dashboard
                    </Link>
                    <Link
                        href="/wallet"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                        <FiCreditCard className="text-lg" />
                        Carteira
                    </Link>
                    <Link
                        href="/profile"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                        <FiUser className="text-lg" />
                        Perfil
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                        type="button"
                    >
                        <FiLogOut className="text-lg" />
                        Sair
                    </button>
                </>
            ) : (
                <>
                    <Link
                        href="/login"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                        <FiLogIn className="text-lg" />
                        Entrar
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1"
                    >
                        <FiUserPlus className="text-lg" />
                        Registrar
                    </Link>
                </>
            )}
        </div>
    );
}

