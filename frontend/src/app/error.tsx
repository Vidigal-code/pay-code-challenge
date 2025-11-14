"use client";
import React from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="max-w-2xl mx-auto py-10 space-y-4">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-sm text-gray-700">{error.message || 'Ocorreu um erro inesperado'}</p>
          <button onClick={reset} className="px-3 py-1 border rounded bg-blue-600 text-white">Tentar novamente</button>
        </div>
      </body>
    </html>
  );
}
