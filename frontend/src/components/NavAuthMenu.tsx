"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { RootState } from '@/store';
import { FiLayout, FiCreditCard, FiUser, FiLogOut, FiLogIn, FiUserPlus } from 'react-icons/fi';

export default function NavAuthMenu({ initialAuth }: { initialAuth: boolean }) {
  const { isAuthenticated, invalidateAuth } = useAuthStatus();
  const { logout } = useAuth();
  const reduxAuth = useSelector((state: RootState) => state.auth?.isAuthenticated || false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleAuthChange = () => {
      invalidateAuth();
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [invalidateAuth]);

  const handleLogout = async () => {
    await logout();
    invalidateAuth();
  };

  const shouldShowAuth = isAuthenticated || reduxAuth || initialAuth;

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
