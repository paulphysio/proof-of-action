/**
 * World App Mini App SDK Integration
 * 
 * Enables the app to run as a Mini App inside World App
 * Challenge: World Build 3 - Hyperscale Mini App
 * 
 * Features:
 * - Gas-free transactions via World Chain
 * - World ID verification
 * - In-app notifications
 * - Mobile-optimized UI
 */

import { useEffect, useState } from 'react';

// World App SDK constants
const WORLD_APP_BRIDGE_URL = 'https://minikit.minidapp.worldcoin.org';

/**
 * Check if running inside World App
 */
export function isRunningInWorldApp() {
  if (typeof window === 'undefined') return false;
  
  // Check for World App user agent or parent window
  const isWorldApp = window.location.ancestorOrigins?.[0]?.includes('worldcoin') ||
                     window.parent !== window ||
                     /WorldApp/.test(navigator.userAgent);
  
  return isWorldApp;
}

/**
 * Initialize World App Mini App SDK
 */
export function initWorldAppSDK() {
  if (typeof window === 'undefined') return;
  
  // Listen for World App messages
  window.addEventListener('message', (event) => {
    if (event.origin !== WORLD_APP_BRIDGE_URL) return;
    
    const { type, payload } = event.data;
    
    switch (type) {
      case 'WALLET_CONNECTED':
        console.log('World App wallet connected:', payload.address);
        break;
      case 'TRANSACTION_SUCCESS':
        console.log('Transaction successful:', payload.hash);
        break;
      case 'TRANSACTION_ERROR':
        console.error('Transaction failed:', payload.error);
        break;
      case 'NOTIFICATION_RECEIVED':
        console.log('Notification:', payload.message);
        break;
      default:
        break;
    }
  });
  
  // Notify parent that Mini App is ready
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'MINI_APP_READY',
      payload: { appId: 'proof-of-action' }
    }, '*');
  }
}

/**
 * Request wallet connection from World App
 */
export async function connectWorldAppWallet() {
  if (!isRunningInWorldApp()) {
    // Fallback to regular MetaMask/wallet connection
    return connectRegularWallet();
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Wallet connection timeout'));
    }, 30000);
    
    const handler = (event) => {
      if (event.origin !== WORLD_APP_BRIDGE_URL) return;
      
      if (event.data.type === 'WALLET_CONNECTED') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve({
          address: event.data.payload.address,
          chainId: event.data.payload.chainId
        });
      }
      
      if (event.data.type === 'WALLET_ERROR') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        reject(new Error(event.data.payload.error));
      }
    };
    
    window.addEventListener('message', handler);
    
    // Request wallet connection
    window.parent.postMessage({
      type: 'CONNECT_WALLET',
      payload: { chainId: 480 } // World Chain
    }, '*');
  });
}

/**
 * Send gas-free transaction via World App
 */
export async function sendWorldAppTransaction(transaction) {
  if (!isRunningInWorldApp()) {
    throw new Error('World App not detected. Use regular wallet for transactions.');
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Transaction timeout'));
    }, 60000);
    
    const handler = (event) => {
      if (event.origin !== WORLD_APP_BRIDGE_URL) return;
      
      if (event.data.type === 'TRANSACTION_SUCCESS') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve({
          hash: event.data.payload.hash,
          blockNumber: event.data.payload.blockNumber
        });
      }
      
      if (event.data.type === 'TRANSACTION_ERROR') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        reject(new Error(event.data.payload.error));
      }
    };
    
    window.addEventListener('message', handler);
    
    // Send transaction request
    window.parent.postMessage({
      type: 'SEND_TRANSACTION',
      payload: {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value || '0'
      }
    }, '*');
  });
}

/**
 * Show notification in World App
 */
export function showWorldAppNotification(title, body, data = {}) {
  if (!isRunningInWorldApp()) {
    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }
  
  window.parent.postMessage({
    type: 'SHOW_NOTIFICATION',
    payload: {
      title,
      body,
      data
    }
  }, '*');
}

/**
 * Request notification permission from World App
 */
export async function requestWorldAppNotifications() {
  if (!isRunningInWorldApp()) {
    // Fallback to browser notifications
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
  
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.origin !== WORLD_APP_BRIDGE_URL) return;
      
      if (event.data.type === 'NOTIFICATION_PERMISSION') {
        window.removeEventListener('message', handler);
        resolve(event.data.payload.status);
      }
    };
    
    window.addEventListener('message', handler);
    
    window.parent.postMessage({
      type: 'REQUEST_NOTIFICATION_PERMISSION'
    }, '*');
  });
}

/**
 * Share content via World App
 */
export function shareViaWorldApp(title, text, url) {
  if (!isRunningInWorldApp()) {
    // Fallback to Web Share API
    if (navigator.share) {
      navigator.share({ title, text, url });
    }
    return;
  }
  
  window.parent.postMessage({
    type: 'SHARE',
    payload: { title, text, url }
  }, '*');
}

/**
 * Open external link in World App browser
 */
export function openInWorldAppBrowser(url) {
  if (!isRunningInWorldApp()) {
    window.open(url, '_blank');
    return;
  }
  
  window.parent.postMessage({
    type: 'OPEN_BROWSER',
    payload: { url }
  }, '*');
}

/**
 * Regular wallet connection fallback
 */
async function connectRegularWallet() {
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask.');
  }
  
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  const chainId = await window.ethereum.request({
    method: 'eth_chainId'
  });
  
  return {
    address: accounts[0],
    chainId: parseInt(chainId, 16)
  };
}

/**
 * React hook for World App integration
 */
export function useWorldApp() {
  const [isInWorldApp, setIsInWorldApp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if running in World App
    const inWorldApp = isRunningInWorldApp();
    setIsInWorldApp(inWorldApp);
    
    // Initialize SDK
    initWorldAppSDK();
    setIsReady(true);
    
    // Listen for wallet connection
    const handler = (event) => {
      if (event.origin !== WORLD_APP_BRIDGE_URL) return;
      
      if (event.data.type === 'WALLET_CONNECTED') {
        setWalletAddress(event.data.payload.address);
      }
    };
    
    window.addEventListener('message', handler);
    
    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);

  const connect = async () => {
    try {
      setError(null);
      const result = await connectWorldAppWallet();
      setWalletAddress(result.address);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isInWorldApp,
    isReady,
    walletAddress,
    error,
    connect,
    showNotification: showWorldAppNotification,
    share: shareViaWorldApp,
    openBrowser: openInWorldAppBrowser
  };
}

/**
 * World App Mini App configuration
 */
export const WORLD_APP_CONFIG = {
  appId: 'proof-of-action',
  appName: 'Proof of Action',
  description: 'Human-only emergency coordination network',
  chainId: 480, // World Chain
  permissions: ['wallet', 'notifications', 'camera', 'location'],
  features: {
    gasFree: true,
    worldId: true,
    notifications: true
  }
};

export default {
  isRunningInWorldApp,
  initWorldAppSDK,
  connectWorldAppWallet,
  sendWorldAppTransaction,
  showWorldAppNotification,
  requestWorldAppNotifications,
  shareViaWorldApp,
  openInWorldAppBrowser,
  useWorldApp,
  WORLD_APP_CONFIG
};
