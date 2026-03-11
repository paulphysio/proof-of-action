'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Fingerprint,
  FileText,
  MapPin,
  Award,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { getWorldIDVerification } from '@/lib/worldid';

// === CLIENT-SIDE ENCRYPTION HELPERS (Web Crypto API) ===
// Uses wallet address + user password for encryption

async function deriveKeyFromWallet(walletAddress, password) {
  const encoder = new TextEncoder();
  const combined = encoder.encode(walletAddress + password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    combined,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = encoder.encode('PoA_Filecoin_v1'); // Fixed salt for consistency
  
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plainData, walletAddress, password) {
  const encoder = new TextEncoder();
  const key = await deriveKeyFromWallet(walletAddress, password);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(plainData))
  );

  return {
    encrypted: Array.from(new Uint8Array(encryptedBuffer)),
    iv: Array.from(iv),
    walletHash: await hashWallet(walletAddress),
  };
}

async function decryptData(encryptedObj, walletAddress, password) {
  // Check if data is actually encrypted (has encrypted and iv fields)
  if (!encryptedObj.encrypted || !encryptedObj.iv) {
    // Data is not encrypted, return as-is
    return encryptedObj;
  }
  
  const { encrypted, iv } = encryptedObj;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const key = await deriveKeyFromWallet(walletAddress, password);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encrypted)
  );
  
  return JSON.parse(decoder.decode(decryptedBuffer));
}

async function hashWallet(walletAddress) {
  const encoder = new TextEncoder();
  const data = encoder.encode(walletAddress);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function FilecoinStorageManager({ walletAddress }) {
  const [storedItems, setStoredItems] = useState([]);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stored');
  const [selectedItem, setSelectedItem] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState([]);
  const [copiedCid, setCopiedCid] = useState(null);

  const REQUIRED_ATTOFIL = 60000000000000000n;

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Load stored items from localStorage
  const loadStoredItems = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const items = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
      setStoredItems(items);
    } catch {
      setStoredItems([]);
    }
  }, []);

  useEffect(() => {
    loadStoredItems();
  }, [loadStoredItems]);

  // Store World ID verification data
  const storeWorldIDData = async () => {
    if (!password) {
      addLog('❌ Please enter your encryption password');
      return;
    }

    const verification = getWorldIDVerification();
    if (!verification) {
      addLog('❌ No World ID verification found. Please verify first.');
      return;
    }

    setIsLoading(true);
    addLog('🔐 Encrypting World ID data...');

    try {
      const dataToStore = {
        type: 'world_id_verification',
        timestamp: new Date().toISOString(),
        verification,
        walletAddress,
      };

      const encrypted = await encryptData(dataToStore, walletAddress, password);
      
      addLog('📤 Uploading to Filecoin...');
      const response = await fetch('/api/filecoin/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted }),
      });

      const result = await response.json();

      if (result.success) {
        const newItem = {
          pieceCid: result.pieceCid,
          timestamp: new Date().toISOString(),
          type: 'world_id_verification',
          size: result.size,
          walletHash: encrypted.walletHash,
        };

        const updated = [newItem, ...storedItems];
        localStorage.setItem('filecoin_storage', JSON.stringify(updated));
        setStoredItems(updated);
        addLog(`✅ World ID data stored! CID: ${result.pieceCid.slice(0, 20)}...`);
      } else {
        addLog(`❌ Storage failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`💥 Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Store custom data
  const storeCustomData = async (dataType, content) => {
    if (!password) {
      addLog('❌ Please enter your encryption password');
      return;
    }

    setIsLoading(true);
    addLog(`🔐 Encrypting ${dataType} data...`);

    try {
      const dataToStore = {
        type: dataType,
        timestamp: new Date().toISOString(),
        content,
        walletAddress,
      };

      const encrypted = await encryptData(dataToStore, walletAddress, password);
      
      addLog('📤 Uploading to Filecoin...');
      const response = await fetch('/api/filecoin/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted }),
      });

      const result = await response.json();

      if (result.success) {
        const newItem = {
          pieceCid: result.pieceCid,
          timestamp: new Date().toISOString(),
          type: dataType,
          size: result.size,
          walletHash: encrypted.walletHash,
        };

        const updated = [newItem, ...storedItems];
        localStorage.setItem('filecoin_storage', JSON.stringify(updated));
        setStoredItems(updated);
        addLog(`✅ ${dataType} stored! CID: ${result.pieceCid.slice(0, 20)}...`);
      } else {
        addLog(`❌ Storage failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`💥 Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Retrieve and decrypt data
  const retrieveData = async (item) => {
    if (!password) {
      addLog('❌ Please enter your encryption password');
      return;
    }

    setIsLoading(true);
    setSelectedItem(item);
    addLog('🔄 Retrieving from Filecoin...');

    try {
      const response = await fetch(`/api/filecoin/retrieve?pieceCid=${item.pieceCid}`);
      const result = await response.json();

      if (result.success) {
        addLog('🔓 Decrypting data...');
        const decrypted = await decryptData(result.data, walletAddress, password);
        setDecryptedContent(decrypted);
        addLog('✅ Data decrypted successfully');
      } else {
        addLog(`❌ Retrieval failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`💥 Error: ${error.message}`);
      setDecryptedContent(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete from local storage (data remains on Filecoin)
  const deleteItem = (pieceCid) => {
    const updated = storedItems.filter(item => item.pieceCid !== pieceCid);
    localStorage.setItem('filecoin_storage', JSON.stringify(updated));
    setStoredItems(updated);
    if (selectedItem?.pieceCid === pieceCid) {
      setSelectedItem(null);
      setDecryptedContent(null);
    }
    addLog('🗑️ Removed from local list (data remains on Filecoin)');
  };

  const copyToClipboard = (cid) => {
    navigator.clipboard.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'world_id_verification': return <Fingerprint size={16} color="#06B6D4" />;
      case 'movement_proof': return <MapPin size={16} color="#10B981" />;
      case 'response_commitment': return <Award size={16} color="#F59E0B" />;
      case 'reputation': return <Award size={16} color="#8B5CF6" />;
      default: return <FileText size={16} color="#94A3B8" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'world_id_verification': return 'World ID';
      case 'movement_proof': return 'Movement Proof';
      case 'response_commitment': return 'Response Commitment';
      case 'reputation': return 'Reputation';
      default: return type.replace(/_/g, ' ');
    }
  };

  const canStore = !!password;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div 
        className="p-4"
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="animate-pulse-glow"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={24} color="#8B5CF6" />
            </div>
            <div>
              <h4 className="m-0" style={{ color: 'white', fontWeight: 700 }}>Filecoin Storage</h4>
              <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {storedItems.length} items stored • Decentralized & Encrypted
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setActiveTab('stored')}
              className="btn btn-sm"
              style={{ 
                background: activeTab === 'stored' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: activeTab === 'stored' ? 'white' : 'var(--slate-400)'
              }}
            >
              <Database size={14} className="me-1" />
              Stored
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className="btn btn-sm"
              style={{ 
                background: activeTab === 'upload' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: activeTab === 'upload' ? 'white' : 'var(--slate-400)'
              }}
            >
              <Upload size={14} className="me-1" />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Password Input */}
      <div className="p-3" style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative flex-grow-1">
            <Lock size={14} color="var(--slate-500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter encryption password (wallet + password)"
              className="form-control"
              style={{ 
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'white',
                paddingLeft: '40px',
                paddingRight: '40px',
                fontSize: '0.875rem'
              }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={14} color="var(--slate-500)" /> : <Eye size={14} color="var(--slate-500)" />}
            </button>
          </div>
        </div>
        {!password && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <AlertCircle size={12} color="#F59E0B" />
            <small style={{ color: '#F59E0B', fontSize: '0.75rem' }}>
              Enter password to enable encryption
            </small>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'stored' ? (
          <div>
            {storedItems.length === 0 ? (
              <div className="text-center py-5">
                <Database size={48} color="var(--slate-600)" className="mb-3" />
                <p style={{ color: 'var(--slate-400)' }}>No stored data yet</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="btn btn-outline-glass btn-sm mt-2"
                >
                  Store your first data
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {storedItems.map((item) => (
                  <div key={item.pieceCid} className="col-12">
                    <div 
                      className="p-3 rounded"
                      style={{ 
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: selectedItem?.pieceCid === item.pieceCid 
                          ? '1px solid rgba(139, 92, 246, 0.5)' 
                          : '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '8px',
                              background: 'rgba(139, 92, 246, 0.1)'
                            }}
                          >
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                                {getTypeLabel(item.type)}
                              </span>
                              <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <code style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                                {item.pieceCid.slice(0, 20)}...{item.pieceCid.slice(-8)}
                              </code>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(item.pieceCid); }}
                                style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer' }}
                              >
                                {copiedCid === item.pieceCid ? <Check size={12} color="#10B981" /> : <Copy size={12} color="var(--slate-500)" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); retrieveData(item); }}
                            disabled={isLoading || !password}
                            className="btn btn-sm btn-outline-glass"
                            style={{ padding: '0.375rem 0.75rem' }}
                          >
                            {isLoading && selectedItem?.pieceCid === item.pieceCid ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><Unlock size={14} className="me-1" /> Decrypt</>
                            )}
                          </button>
                          <a
                            href={`https://calibration.filscan.io/en/cid/${item.pieceCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-sm btn-outline-glass"
                            style={{ padding: '0.375rem' }}
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.pieceCid); }}
                            className="btn btn-sm"
                            style={{ 
                              padding: '0.375rem', 
                              background: 'transparent',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              color: '#F43F5E'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h5 className="mb-3" style={{ color: 'white', fontWeight: 600 }}>Store Data on Filecoin</h5>
            
            <div className="row g-3">
              {/* World ID Data */}
              <div className="col-md-6">
                <button
                  onClick={storeWorldIDData}
                  disabled={isLoading || !canStore || !password}
                  className="w-100 p-4 rounded text-start"
                  style={{ 
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    cursor: canStore && password ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <Fingerprint size={24} color="#06B6D4" />
                    <span style={{ color: 'white', fontWeight: 600 }}>World ID Data</span>
                  </div>
                  <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                    Store your verified identity proof on Filecoin for portability
                  </p>
                </button>
              </div>

              {/* Custom Data */}
              <div className="col-md-6">
                <button
                  onClick={() => storeCustomData('personal_note', { note: 'My private note', created: new Date().toISOString() })}
                  disabled={isLoading || !canStore || !password}
                  className="w-100 p-4 rounded text-start"
                  style={{ 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    cursor: canStore && password ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <FileText size={24} color="#8B5CF6" />
                    <span style={{ color: 'white', fontWeight: 600 }}>Personal Note</span>
                  </div>
                  <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                    Store encrypted personal notes and data
                  </p>
                </button>
              </div>

              {/* Reputation Data */}
              <div className="col-md-6">
                <button
                  onClick={() => storeCustomData('reputation', { reputation: 'User reputation data', timestamp: new Date().toISOString() })}
                  disabled={isLoading || !canStore || !password}
                  className="w-100 p-4 rounded text-start"
                  style={{ 
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: canStore && password ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <Award size={24} color="#F59E0B" />
                    <span style={{ color: 'white', fontWeight: 600 }}>Reputation Data</span>
                  </div>
                  <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                    Backup your reputation and achievements
                  </p>
                </button>
              </div>

              {/* Response Data */}
              <div className="col-md-6">
                <button
                  onClick={() => storeCustomData('response_data', { responses: 'Emergency response history', timestamp: new Date().toISOString() })}
                  disabled={isLoading || !canStore || !password}
                  className="w-100 p-4 rounded text-start"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: canStore && password ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <Shield size={24} color="#10B981" />
                    <span style={{ color: 'white', fontWeight: 600 }}>Response History</span>
                  </div>
                  <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                    Store your emergency response commitments
                  </p>
                </button>
              </div>
            </div>

            {!password && (
              <div className="mt-3 p-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={16} color="#F59E0B" />
                  <small style={{ color: '#F59E0B' }}>Enter your encryption password above to enable storage</small>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decrypted Content Display */}
        {decryptedContent && (
          <div className="mt-4">
            <div 
              className="p-3 rounded"
              style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Unlock size={16} color="#10B981" />
                  <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.875rem' }}>Decrypted Content</span>
                </div>
                <button 
                  onClick={() => setDecryptedContent(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <pre 
                className="m-0 p-2 rounded"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  color: 'var(--slate-300)', 
                  fontSize: '0.75rem',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}
              >
                {JSON.stringify(decryptedContent, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="mt-4">
            <div 
              className="p-3 rounded"
              style={{ 
                background: 'rgba(15, 23, 42, 0.8)', 
                border: '1px solid rgba(255,255,255,0.05)',
                maxHeight: '150px',
                overflow: 'auto'
              }}
            >
              <small style={{ color: 'var(--slate-500)', fontSize: '0.6875rem', display: 'block', marginBottom: '0.5rem' }}>
                Activity Log
              </small>
              {logs.map((log, i) => (
                <div key={i} style={{ color: 'var(--slate-400)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
