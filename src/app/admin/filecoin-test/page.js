'use client';

import { useState, useEffect } from 'react';

// === CLIENT-SIDE ENCRYPTION HELPERS (Web Crypto API) ===
async function encryptData(plainData, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(plainData))
  );

  return {
    encrypted: Array.from(new Uint8Array(encryptedBuffer)),
    iv: Array.from(iv),
    salt: Array.from(salt),
  };
}

async function decryptData(encryptedObj, password) {
  const { encrypted, iv, salt } = encryptedObj;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encrypted)
  );
  return JSON.parse(decoder.decode(decryptedBuffer));
}
export default function FilecoinTestPage() {
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [canCommit, setCanCommit] = useState(false);
  const [password, setPassword] = useState('my-secret-password-123'); // ← CHANGE THIS or let user type
  const [uploadResult, setUploadResult] = useState(null); // stores pieceCid + iv/salt for demo

  const REQUIRED_ATTOFIL = 60000000000000000n;
  const connectedWallet = '0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5';

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchWalletBalance = async () => {
    // (your existing balance code - unchanged)
    try {
      const res = await fetch(`/api/filecoin/get-balance?address=${connectedWallet}`);
      const data = await res.json();
      if (data.balance) {
        const bal = BigInt(data.balance);
        setWalletBalance(bal);
        setCanCommit(bal >= REQUIRED_ATTOFIL);
      }
    } catch (err) {
      addLog(`💥 Balance check failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (connectedWallet) fetchWalletBalance();
  }, []);

  const testFilecoinUpload = async () => {
    if (!password) {
      alert('Please enter an encryption password');
      return;
    }
    if (!canCommit) {
      setStatus('❌ Insufficient tFIL for gas');
      return;
    }

    setIsLoading(true);
    setStatus('');
    setLogs([]);
    setUploadResult(null);

    try {
      addLog('🧪 Starting Filecoin test...');

      const testData = {
        type: 'private-user-data',
        timestamp: new Date().toISOString(),
        message: 'This is my secret data!',
        random: Math.random(),
      };

      // === ENCRYPT ON CLIENT ===
      addLog('🔐 Encrypting data client-side...');
      const encryptedPayload = await encryptData(testData, password);
      addLog('✅ Encryption complete — only you can read this');

      addLog('📤 Sending encrypted data to Filecoin...');
      const response = await fetch('/api/filecoin/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encryptedPayload }), // ← ONLY encrypted bytes
      });

      const result = await response.json();
      addLog(`📊 Store response: ${JSON.stringify(result)}`);

      if (result.success) {
        setUploadResult({ pieceCid: result.pieceCid, encryptedObj: encryptedPayload });

        setStatus(`✅ Uploaded & Encrypted!\nPieceCID: ${result.pieceCid}`);
        addLog(`🎉 Success — PieceCID: ${result.pieceCid} (encrypted)`);

        // Auto-retrieve + decrypt
        addLog('🔄 Retrieving encrypted data...');
        const retrieveRes = await fetch(`/api/filecoin/retrieve?pieceCid=${result.pieceCid}`);
        const retrieveData = await retrieveRes.json();

        if (retrieveData.success) {
          const decrypted = await decryptData(retrieveData.data, password);
          addLog(`✅ Decrypted & Verified: ${JSON.stringify(decrypted)}`);
        } else {
          addLog(`❌ Retrieve failed: ${retrieveData.error}`);
        }
      } else {
        setStatus(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      addLog(`💥 ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Filecoin Onchain Cloud — Encrypted Upload</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Wallet</h2>
        <p><strong>Address:</strong> {connectedWallet}</p>
        <p><strong>tFIL:</strong> {walletBalance !== null ? `${Number(walletBalance) / 1e18} FIL` : 'Loading...'}</p>
        {!canCommit && <p className="text-red-600">⚠️ Add tFIL for gas</p>}

        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">
            Encryption Password (only you know this):
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Enter a strong password"
          />
          <p className="text-xs text-gray-500 mt-1">
            In a real app, use the user&apos;s master key or let them choose per upload
          </p>
        </div>
      </div>

      <button
        onClick={testFilecoinUpload}
        disabled={isLoading || !canCommit || !password}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
      >
        {isLoading ? 'Encrypting & Uploading...' : 'Encrypt → Upload → Retrieve & Decrypt'}
      </button>

      <div className="mt-8 bg-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm max-h-96 overflow-auto">
        <h3 className="font-semibold mb-3">Logs</h3>
        {logs.length === 0 ? 'Click the button to start →' : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {status && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl whitespace-pre-line">{status}</div>
      )}
    </div>
  );
}