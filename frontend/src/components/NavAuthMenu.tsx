"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export default function NavAuthMenu({ initialAuth }: { initialAuth: boolean }) {
  const storeAuth = useSelector((s: RootState) => s.auth.isAuthenticated);
  const isAuth = useMemo(() => (typeof storeAuth === 'boolean' ? storeAuth : initialAuth) || initialAuth, [storeAuth, initialAuth]);
  const { logout } = useAuth();

  return (
    <nav className="flex items-center gap-3 text-sm">
      {isAuth ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/wallet">Wallet</Link>
          <Link href="/profile">Profile</Link>
          <button onClick={() => { void logout(); }} className="px-3 py-1 border rounded" type="button">Logout</button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/signup">Signup</Link>
        </>
      )}
    </nav>
  );
}
