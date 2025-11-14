"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {useSelector, useDispatch} from "react-redux";
import {FiMenu, FiX, FiSun, FiMoon, FiCreditCard, FiLogOut, FiUser, FiLayout} from "react-icons/fi";
import {toggleTheme} from "../store/slices/theme.slice";
import {setAuthenticated} from "../store/slices/authSlice";
import {RootState} from "../store";
import {SESSION_COOKIE} from "../lib/config";

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[]\\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
}

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const theme = useSelector((state: RootState) => state.theme?.theme || "light");
    const dispatch = useDispatch();
    const reduxAuth = useSelector((state: RootState) => state.auth?.isAuthenticated || false);
    
    const [isAuth, setIsAuth] = useState(() => {
        if (typeof window === "undefined") return false;
        return !!readCookie(SESSION_COOKIE);
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const checkAuth = () => {
            const hasCookie = !!readCookie(SESSION_COOKIE);
            setIsAuth(hasCookie);
            if (hasCookie !== reduxAuth) {
                dispatch(setAuthenticated(hasCookie));
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 500);
        return () => clearInterval(interval);
    }, [dispatch, reduxAuth]);

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", {method: "POST", credentials: "include"});
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            dispatch(setAuthenticated(false));
            window.location.href = "/";
        }
    };

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <FiCreditCard className="text-2xl text-blue-600 dark:text-blue-400" />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            PAYCODE
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {isAuth ? (
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
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
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
                                >
                                    <FiLogOut className="text-lg" />
                                    Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                                >
                                    Criar Conta
                                </Link>
                            </>
                        )}
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? (
                                <FiMoon className="text-xl text-gray-700 dark:text-gray-300" />
                            ) : (
                                <FiSun className="text-xl text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <FiX className="text-2xl text-gray-700 dark:text-gray-300" />
                        ) : (
                            <FiMenu className="text-2xl text-gray-700 dark:text-gray-300" />
                        )}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col gap-4">
                            {isAuth ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 flex items-center gap-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FiLayout className="text-lg" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/wallet"
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Carteira
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 flex items-center gap-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FiUser className="text-lg" />
                                        Perfil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="text-left text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors py-2 flex items-center gap-2"
                                    >
                                        <FiLogOut className="text-lg" />
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-center"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Criar Conta
                                    </Link>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    dispatch(toggleTheme());
                                    setIsMenuOpen(false);
                                }}
                                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 py-2"
                            >
                                {theme === "light" ? (
                                    <>
                                        <FiMoon className="text-lg" />
                                        Modo Escuro
                                    </>
                                ) : (
                                    <>
                                        <FiSun className="text-lg" />
                                        Modo Claro
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

