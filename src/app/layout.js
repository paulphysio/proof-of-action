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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0d6efd" />
        <meta name="description" content="Proof-of-Action: Privacy-first community emergency app with AI verification and on-chain rewards" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <title>Proof-of-Action</title>
      </head>
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
