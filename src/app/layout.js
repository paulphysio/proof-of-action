'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { WalletProvider } from '@/lib/near-wallet';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/notifications';

export default function RootLayout({ children }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="background-color" content="#0F172A" />
        <meta name="description" content="Proof-of-Action: A privacy-first Web3 emergency network where real-world helpful actions are verified by AI and rewarded with blockchain tokens" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/ICON.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <title>Proof-of-Action | Web3 Emergency Network</title>
      </head>
      <body style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
