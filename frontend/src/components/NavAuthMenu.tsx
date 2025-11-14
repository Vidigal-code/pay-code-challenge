"use client";

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { SESSION_COOKIE } from '../lib/config';
import { FiLayout, FiCreditCard, FiUser, FiLogOut, FiLogIn, FiUserPlus } from 'react-icons/fi';

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[]\\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
}

export default function NavAuthMenu({ initialAuth }: { initialAuth: boolean }) {
  const storeAuth = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [isAuth, setIsAuth] = useState(initialAuth);
  const [mounted, setMounted] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkAuth = () => {
      const hasCookie = !!readCookie(SESSION_COOKIE);
      const authState = hasCookie || storeAuth || initialAuth;
      setIsAuth(authState);
    };

    checkAuth();
    
    if (!mounted) return;
    
    let mountedFlag = true;
    
    const interval = setInterval(() => {
      if (mountedFlag) checkAuth();
    }, 300);
    
    const handleAuthChange = () => {
      if (mountedFlag) checkAuth();
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('focus', checkAuth);
    
    return () => {
      mountedFlag = false;
      clearInterval(interval);
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('focus', checkAuth);
    };
  }, [storeAuth, mounted, initialAuth]);

  const handleLogout = async () => {
    await logout();
    setIsAuth(false);
  };

  const shouldShowAuth = isAuth || storeAuth || (typeof window !== "undefined" && !!readCookie(SESSION_COOKIE));

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
            Criar Conta
          </Link>
        </>
      )}
    </div>
  );
}
