'use client';

import { useEffect } from 'react';

/**
 * Global error boundary for the ClientOS app.
 *
 * Browser extensions (MetaMask, etc.) inject scripts that throw errors which
 * Next.js surfaces as "Unhandled Runtime Error" overlays. ClientOS has no
 * Web3/wallet code — these errors come entirely from the extension. This
 * boundary silently swallows extension-originated errors and lets the app
 * continue rendering.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = String(error?.message || '');
    const stack = String(error?.stack || '');
    const isExtension =
      /metamask|inpage\.js|chrome-extension/i.test(msg) ||
      /metamask|inpage\.js|chrome-extension/i.test(stack);

    if (isExtension) {
      // Swallow extension errors — they're not from our code
      console.warn('[ClientOS] Suppressed browser extension error:', msg);
      // Auto-recover so the page continues rendering
      reset();
    }
  }, [error, reset]);

  // For real errors, show a minimal error message
  const msg = String(error?.message || 'Something went wrong');
  const isExtension = /metamask|inpage\.js|chrome-extension/i.test(msg);

  if (isExtension) {
    // Return null so the page keeps rendering normally
    return null;
  }

  return (
    <div style={{ padding: '2rem', color: '#ff6b6b', fontFamily: 'monospace' }}>
      <h2>Application Error</h2>
      <p>{msg}</p>
      <button onClick={reset} style={{ marginTop: '1rem', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  );
}
