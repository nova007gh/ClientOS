import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ClientOS AI — Client Acquisition Platform',
  description: 'Find, qualify, and close clients with AI-powered outreach, audits, and project management.',
};

// Suppress uncaught errors from browser extensions (e.g. MetaMask inpage.js
// throws "Failed to connect to MetaMask"). ClientOS has no Web3/wallet code —
// the error is purely from the extension injecting into the page.
const extensionGuard = `(function(){
  if (window.__extGuard) return; window.__extGuard = true;
  var isExt = function(m){ return /metamask|inpage\\.js|chrome-extension/i.test(String(m||'')); };
  window.addEventListener('error', function(e){
    if (isExt(e.message) || (e.error && isExt(e.error.stack))) { e.preventDefault(); e.stopPropagation(); return true; }
  }, true);
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    if (r && (isExt(r.message) || isExt(r.stack))) { e.preventDefault(); }
  }, true);
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: extensionGuard }} />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
