"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {FiArrowRight, FiShield, FiZap, FiTrendingUp, FiDollarSign, FiLock, FiSmartphone, FiSend, FiDownload, FiRefreshCw, FiCheckCircle, FiXCircle, FiBarChart2, FiCreditCard, FiUser} from "react-icons/fi";

export default function HomePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || "paycode_session";
        const session = document.cookie.includes(cookieName);
        if (session) {
            router.push("/wallet");
        }
    }, [router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-block mb-6">
                        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                            PAYCODE
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto animate-slide-up">
                        Sua carteira digital segura e moderna
                    </p>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto animate-slide-up">
                        Transfira, deposite e gerencie seu dinheiro com facilidade e segurança
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up animation-delay-200">
                        <Link
                            href="/signup"
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 hover:from-blue-700 hover:to-purple-700"
                        >
                            Criar Conta Grátis
                            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-xl font-semibold text-lg hover:border-blue-600 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                        >
                            Entrar
                        </Link>
                    </div>
                </div>

                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                        Funcionalidades
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
                                <FiUser className="text-3xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Cadastro e Autenticação</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Crie sua conta de forma rápida e segura. Sistema de autenticação com JWT e JWE para máxima proteção.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Cadastro simples e rápido
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Login seguro com JWT/JWE
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Gerenciamento de perfil
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
                                <FiCreditCard className="text-3xl text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Carteira Digital</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Crie e gerencie sua carteira digital. Cada usuário possui uma carteira única vinculada à sua conta.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Criação automática de carteira
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Visualização de saldo em tempo real
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Histórico completo de transações
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-6">
                                <FiDownload className="text-3xl text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Depósito de Dinheiro</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Adicione fundos à sua carteira de forma instantânea. O sistema valida e atualiza seu saldo automaticamente.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Depósitos instantâneos
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Suporte a saldo negativo
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Descrição opcional para cada depósito
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mb-6">
                                <FiSend className="text-3xl text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Transferência de Dinheiro</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Envie dinheiro para outros usuários de forma rápida e segura. Validação automática de saldo antes da transferência.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Transferências instantâneas
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Validação de saldo automática
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Proteção contra transferência para si mesmo
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mb-6">
                                <FiRefreshCw className="text-3xl text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Reversão de Transações</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Todas as transações podem ser revertidas. Sistema completo de rollback para garantir a integridade dos dados.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Reversão de depósitos
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Reversão de transferências
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Rollback automático em caso de erro
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mb-6">
                                <FiBarChart2 className="text-3xl text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard e KPIs</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Acompanhe todas suas métricas financeiras em tempo real com um dashboard completo e intuitivo.
                            </p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Saldo total atualizado
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Total de depósitos e transferências
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" />
                                    Estatísticas de transações
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-20 mb-20">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
                            <FiShield className="text-3xl text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Segurança Avançada</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            JWT + JWE, criptografia de ponta a ponta e proteções OWASP para manter seus dados seguros. Autenticação baseada em cookies HTTP-only.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-6">
                            <FiZap className="text-3xl text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Transações Rápidas</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Deposite, transfira e gerencie seu dinheiro instantaneamente, 24/7. Processamento em tempo real com validações automáticas.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
                            <FiTrendingUp className="text-3xl text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Validações Inteligentes</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Sistema completo de validação de saldo antes de transferências. Suporte a saldo negativo com correção automática em depósitos.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8 mt-12 mb-20">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                        <FiDollarSign className="text-4xl text-blue-600 dark:text-blue-400 mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Depósitos Instantâneos</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Adicione fundos à sua carteira a qualquer momento com processamento imediato</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
                        <FiLock className="text-4xl text-purple-600 dark:text-purple-400 mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reversão Completa</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Todas as operações podem ser revertidas a qualquer momento</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-xl border border-green-200 dark:border-green-700">
                        <FiSmartphone className="text-4xl text-green-600 dark:text-green-400 mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">100% Responsivo</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Acesse de qualquer dispositivo, desktop ou mobile</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-6 rounded-xl border border-orange-200 dark:border-orange-700">
                        <FiBarChart2 className="text-4xl text-orange-600 dark:text-orange-400 mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Métricas em Tempo Real</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Acompanhe todos os seus KPIs financeiros atualizados</p>
                    </div>
                </div>

                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center transform hover:scale-110 transition-transform">
                        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">100%</div>
                        <div className="text-gray-600 dark:text-gray-300 font-medium">Seguro</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform">
                        <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
                        <div className="text-gray-600 dark:text-gray-300 font-medium">Disponível</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform">
                        <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">0%</div>
                        <div className="text-gray-600 dark:text-gray-300 font-medium">Taxas</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform">
                        <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">∞</div>
                        <div className="text-gray-600 dark:text-gray-300 font-medium">Limite</div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Como Funciona</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">1</div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Crie sua Conta</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Cadastre-se com email, nome e senha. Sua carteira será criada automaticamente.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">2</div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Deposite ou Transfira</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Adicione fundos à sua carteira ou transfira para outros usuários. Todas as operações são validadas automaticamente.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">3</div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Acompanhe e Gerencie</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Visualize seu saldo, histórico de transações e métricas no dashboard. Reverta transações quando necessário.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                    opacity: 0;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
                .animation-delay-600 {
                    animation-delay: 0.6s;
                }
                .animation-delay-800 {
                    animation-delay: 0.8s;
                }
                .animation-delay-1000 {
                    animation-delay: 1s;
                }
                .animation-delay-1200 {
                    animation-delay: 1.2s;
                }
                .animation-delay-1400 {
                    animation-delay: 1.4s;
                }
                .animation-delay-1600 {
                    animation-delay: 1.6s;
                }
                .animation-delay-1800 {
                    animation-delay: 1.8s;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-2200 {
                    animation-delay: 2.2s;
                }
                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                    opacity: 0;
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
