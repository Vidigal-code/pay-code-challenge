"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-16">
            <div className="max-w-lg w-full bg-white/90 dark:bg-gray-900/80 backdrop-blur shadow-2xl rounded-3xl border border-white/60 dark:border-gray-800 p-10 text-center space-y-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-3xl font-bold shadow-lg">
                    404
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        Página não encontrada
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        A página que você tentou acessar não existe, foi movida ou o link está incorreto.
                        Continue explorando a PAYCODE pelo botão abaixo.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Voltar
                    </button>
                    <Link
                        href="/"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        Ir para a página inicial
                    </Link>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Precisa de ajuda? Entre em contato com o suporte através do menu principal.
                </div>
            </div>
        </div>
    );
}
