/**
 * Embedded Solana Wallet
 * 
 * Provides in-app wallet creation/import using a recovery phrase (mnemonic).
 * The Solana public key is used as the app identity and stored in Supabase.
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import { getOrCreateUser } from '@/lib/supabase';

// Wallet context
const WalletContext = createContext(null);

const STORAGE_KEY = 'poa_solana_secret_key';
const DERIVATION_PATH = "m/44'/501'/0'/0'";

function normalizeMnemonic(mnemonic) {
  return (mnemonic || '').trim().toLowerCase().split(/\s+/).join(' ');
}

function keypairFromMnemonic(mnemonic) {
  const normalized = normalizeMnemonic(mnemonic);
  if (!bip39.validateMnemonic(normalized)) {
    throw new Error('Invalid recovery phrase');
  }

  const seed = bip39.mnemonicToSeedSync(normalized);
  const derived = derivePath(DERIVATION_PATH, seed.toString('hex'));
  const keypair = Keypair.fromSeed(Uint8Array.from(derived.key).slice(0, 32));
  return keypair;
}

function keypairFromStoredSecretKey() {
  if (typeof window === 'undefined') return null;
  const encoded = window.localStorage.getItem(STORAGE_KEY);
  if (!encoded) return null;
  const secret = bs58.decode(encoded);
  return Keypair.fromSecretKey(secret);
}

function persistKeypair(keypair) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, bs58.encode(keypair.secretKey));
}

function clearPersistedKeypair() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function WalletProvider({ children }) {
  const [keypair, setKeypair] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = keypairFromStoredSecretKey();
      if (stored) {
        setKeypair(stored);
        setAccountId(stored.publicKey.toBase58());
      }
    } catch (error) {
      console.error('Failed to load embedded wallet from storage:', error);
      clearPersistedKeypair();
    } finally {
      setIsReady(true);
    }
  }, []);

  // Ensure a Supabase user row exists for any connected wallet
  useEffect(() => {
    if (!accountId) return;

    (async () => {
      try {
        await getOrCreateUser(accountId);
      } catch (error) {
        console.error('Failed to create/load user in Supabase:', error);
      }
    })();
  }, [accountId]);

  const createWallet = useCallback(async () => {
    const mnemonic = bip39.generateMnemonic(128);
    const kp = keypairFromMnemonic(mnemonic);
    persistKeypair(kp);
    setKeypair(kp);
    setAccountId(kp.publicKey.toBase58());
    return { mnemonic, publicKey: kp.publicKey.toBase58() };
  }, []);

  const importWallet = useCallback(async (mnemonic) => {
    const kp = keypairFromMnemonic(mnemonic);
    persistKeypair(kp);
    setKeypair(kp);
    setAccountId(kp.publicKey.toBase58());
    return { publicKey: kp.publicKey.toBase58() };
  }, []);

  // Backward-compatible: existing pages call signIn()
  // We'll implement it as an in-app import prompt.
  const signIn = useCallback(async () => {
    const phrase = window.prompt('Enter your Solana recovery phrase (12 or 24 words):');
    if (!phrase) return null;
    return importWallet(phrase);
  }, [importWallet]);

  const signOut = useCallback(async () => {
    clearPersistedKeypair();
    setAccountId(null);
    setKeypair(null);
  }, []);

  const getPublicKey = useCallback(() => {
    if (!keypair) return null;
    return keypair.publicKey.toBase58();
  }, [keypair]);

  const signMessage = useCallback(async (message) => {
    if (!keypair) throw new Error('Wallet not connected');
    const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
    // web3.js Keypair does not expose sign directly; use secretKey w/ tweetnacl via web3 internally.
    // For now, return null; add proper message signing if you later secure Supabase writes server-side.
    return { publicKey: keypair.publicKey.toBase58(), signature: null, message: data };
  }, [keypair]);

  const value = {
    wallet: keypair,
    accountId,
    isReady,
    isSignedIn: !!accountId,
    signIn,
    signOut,
    createWallet,
    importWallet,
    getPublicKey,
    signMessage
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Placeholder “on-chain” interactions (still mocked)
export async function mintProofPoints(walletAddress, amount) {
  console.log(`(mock) Minting ${amount} Proof Points for Solana wallet ${walletAddress}`);
  return {
    transactionSignature: 'mock-solana-tx-' + Date.now(),
    status: 'success',
    amount
  };
}

export async function getTokenBalance(walletAddress) {
  console.log(`(mock) Getting token balance for Solana wallet ${walletAddress}`);
  return Math.floor(Math.random() * 100) + 10;
}

export async function claimRewards(walletAddress) {
  console.log(`(mock) Claiming rewards for Solana wallet ${walletAddress}`);
  return {
    transactionSignature: 'mock-solana-claim-' + Date.now(),
    status: 'success',
    amount: 10
  };
}

export function isValidSolanaPublicKey(address) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
