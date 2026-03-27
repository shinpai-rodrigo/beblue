'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-blue-600 mb-2">404</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Pagina nao encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
