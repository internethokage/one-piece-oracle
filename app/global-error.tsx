'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Global error boundary — catches layout-level errors
// Must include its own <html> and <body>
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[One Piece Oracle] Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#0a0e1a',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💀</div>
          <h1
            style={{ color: '#d4af37', fontSize: '3rem', marginBottom: '0.5rem' }}
          >
            Critical Error
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
            The Oracle has gone offline. Oda-sensei is on a break.
          </p>
          {error.digest && (
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#d4af37',
              color: '#0a0e1a',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
