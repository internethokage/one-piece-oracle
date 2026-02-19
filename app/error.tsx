'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('[One Piece Oracle] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-4 text-center">
      {/* Ship in distress */}
      <div className="text-7xl mb-6 select-none" aria-hidden="true">
        🌊
      </div>

      <h1 className="text-[#d4af37] font-black text-5xl md:text-7xl mb-3 tracking-tight">
        Rough Seas
      </h1>
      <p className="text-slate-400 text-base md:text-lg max-w-md mb-2">
        The Oracle hit unexpected turbulence on the Grand Line.
      </p>

      {/* Error detail (digest only in production) */}
      {error.digest && (
        <p className="text-slate-600 text-xs font-mono mb-6">
          Error ID: {error.digest}
        </p>
      )}

      {/* Dev-only message */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-6 text-left max-w-lg w-full">
          <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-400 mb-2">
            Developer details
          </summary>
          <pre className="bg-slate-900 text-red-400 text-xs p-4 rounded-lg overflow-auto border border-slate-800">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex items-center gap-3 mb-8 text-slate-600">
        <div className="h-px w-16 bg-slate-700" />
        <span className="text-lg">🏴‍☠️</span>
        <div className="h-px w-16 bg-slate-700" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#d4af37] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#e6c84a] transition-colors text-sm"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:border-[#d4af37] hover:text-[#d4af37] transition-colors text-sm"
        >
          Return to Port
        </a>
      </div>
    </div>
  );
}
