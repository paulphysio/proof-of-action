'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/near-wallet';
import { getWorldIDVerification } from '@/lib/worldid';
import { getFilecoinStorage } from '@/lib/filecoin';
import QRCode from 'qrcode';
import { 
  Download, 
  Upload, 
  Share2, 
  QrCode,
  Shield,
  Check,
  AlertTriangle,
  Wallet,
  Database
} from 'lucide-react';

/**
 * Identity Portability Component
 * 
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 * 
 * Features:
 * - Export reputation as portable JSON
 * - Import reputation from file
 * - Share via QR code
 * - Cross-environment identity verification
 */

export default function IdentityPortability() {
  const { accountId } = useWallet();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrError, setQrError] = useState('');

  const generateIdentityPackage = () => {
    const worldId = getWorldIDVerification();
    const filecoinStorage = getFilecoinStorage();
    
    const identityPackage = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      wallet: accountId,
      worldId: worldId ? {
        nullifier_hash: worldId.nullifier_hash,
        verification_level: worldId.verification_level,
        verifiedAt: worldId.timestamp
      } : null,
      filecoinRecords: filecoinStorage,
      proofOfHistory: {
        totalRecords: filecoinStorage.length,
        calibrationRecords: filecoinStorage.filter(r => r.network === 'filecoin_calibration').length,
        lastUpdated: filecoinStorage.length > 0 
          ? filecoinStorage[filecoinStorage.length - 1].timestamp 
          : null
      },
      signature: null // Would be cryptographically signed in production
    };
    
    return identityPackage;
  };

  const handleExport = () => {
    const data = generateIdentityPackage();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `poa-identity-${accountId?.slice(0, 8)}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExport(false);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess('');
    
    try {
      const data = JSON.parse(importData);
      
      // Validate structure
      if (!data.version || !data.wallet) {
        throw new Error('Invalid identity package format');
      }
      
      // In production, verify cryptographic signature here
      
      // Store imported Filecoin records
      if (data.filecoinRecords && Array.isArray(data.filecoinRecords)) {
        const existing = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
        const merged = [...existing, ...data.filecoinRecords];
        localStorage.setItem('filecoin_storage', JSON.stringify(merged));
      }
      
      // Store World ID if present
      if (data.worldId) {
        localStorage.setItem('worldid_verification', JSON.stringify({
          ...data.worldId,
          timestamp: data.worldId.verifiedAt,
          imported: true,
          importedAt: Date.now()
        }));
      }
      
      setImportSuccess(`Successfully imported identity for wallet ${data.wallet.slice(0, 10)}...`);
      setImportData('');
      
      setTimeout(() => {
        setShowImport(false);
        setImportSuccess('');
      }, 3000);
      
    } catch (error) {
      setImportError(error.message || 'Failed to import identity');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target.result);
    };
    reader.readAsText(file);
  };

  const generateQRData = async () => {
    try {
      const data = generateIdentityPackage();
      // Create a compact version for QR with meaningful data
      const compact = {
        v: data.version,                    // Version
        w: data.wallet?.slice(0, 20),      // Wallet (truncated)
        wid: data.worldId?.nullifier_hash?.slice(0, 20), // World ID (truncated)
        wl: data.worldId?.verification_level, // Verification level
        pts: data.proofOfHistory.totalRecords, // Total proof count
        cal: data.proofOfHistory.calibrationRecords, // Filecoin records
        ts: Date.now(),                     // Timestamp
        app: 'poa-identity',               // App identifier
        sig: 'demo'                        // Signature placeholder
      };
      
      const qrDataString = JSON.stringify(compact);
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrDataString, {
        width: 200,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'L'
      });
      
      setQrCodeUrl(qrDataUrl);
      setQrError('');
      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setQrError('Failed to generate QR code');
      return null;
    }
  };

  const handleRegenerateQR = () => {
    setQrCodeUrl('');
    setQrError('');
    generateQRData();
  };

  // Generate QR code when panel is opened
  useEffect(() => {
    if (showQR) {
      generateQRData();
    }
  }, [showQR]);

  return (
    <div className="glass-card p-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div 
          className="d-flex align-items-center justify-content-center"
          style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)'
          }}
        >
          <Share2 size={24} color="#8B5CF6" />
        </div>
        <div>
          <h5 className="m-0" style={{ color: 'white', fontWeight: 600 }}>
            Portable Identity
          </h5>
          <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
            Export and import your reputation across devices
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setShowExport(!showExport)}
          className="btn btn-outline-glass btn-sm d-flex align-items-center gap-2"
        >
          <Download size={16} />
          Export Identity
        </button>
        <button 
          onClick={() => setShowImport(!showImport)}
          className="btn btn-outline-glass btn-sm d-flex align-items-center gap-2"
        >
          <Upload size={16} />
          Import Identity
        </button>
        <button 
          onClick={() => setShowQR(!showQR)}
          className="btn btn-outline-glass btn-sm d-flex align-items-center gap-2"
        >
          <QrCode size={16} />
          Share QR
        </button>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div 
          className="p-3 rounded mb-3"
          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}
        >
          <div className="d-flex align-items-start gap-2 mb-3">
            <Shield size={18} color="#06B6D4" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="m-0" style={{ color: '#06B6D4', fontSize: '0.875rem', fontWeight: 500 }}>
                Export Your Identity
              </p>
              <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                Download a portable JSON file containing your reputation, World ID verification, 
                and Filecoin storage records. This file can be imported on any device.
              </p>
            </div>
          </div>
          <button 
            onClick={handleExport}
            className="btn btn-gradient w-100"
            disabled={!accountId}
          >
            <Download size={16} className="me-2" />
            Download Identity Package
          </button>
        </div>
      )}

      {/* Import Panel */}
      {showImport && (
        <div 
          className="p-3 rounded mb-3"
          style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
        >
          <div className="d-flex align-items-start gap-2 mb-3">
            <Upload size={18} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="m-0" style={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: 500 }}>
                Import Identity
              </p>
              <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                Upload a previously exported identity file to restore your reputation 
                and verification history on this device.
              </p>
            </div>
          </div>

          {importError && (
            <div 
              className="p-2 rounded mb-2"
              style={{ background: 'rgba(244, 63, 94, 0.15)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={14} color="#F43F5E" />
                <span style={{ color: '#F43F5E', fontSize: '0.75rem' }}>{importError}</span>
              </div>
            </div>
          )}

          {importSuccess && (
            <div 
              className="p-2 rounded mb-2"
              style={{ background: 'rgba(16, 185, 129, 0.15)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <Check size={14} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: '0.75rem' }}>{importSuccess}</span>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
              Upload Identity File (.json)
            </label>
            <input 
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="form-control"
              style={{ 
                background: 'var(--navy-900)',
                border: '1px solid var(--glass-border)',
                color: 'white'
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
              Or paste JSON directly
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste identity JSON here..."
              rows={4}
              className="form-control"
              style={{ 
                background: 'var(--navy-900)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <button 
            onClick={handleImport}
            className="btn btn-gold w-100"
            disabled={!importData}
          >
            <Upload size={16} className="me-2" />
            Import Identity
          </button>
        </div>
      )}

      {/* QR Code Panel */}
      {showQR && (
        <div 
          className="p-3 rounded mb-3 text-center"
          style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
        >
          <div className="d-flex align-items-start gap-2 mb-3">
            <QrCode size={18} color="#10B981" className="flex-shrink-0 mt-0.5" />
            <div className="text-start">
              <p className="m-0" style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 500 }}>
                Share Identity QR
              </p>
              <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                Scan this QR code to quickly share your identity summary with others.
              </p>
            </div>
          </div>

          {qrError ? (
            <div 
              className="p-3 rounded mb-3"
              style={{ background: 'rgba(244, 63, 94, 0.15)' }}
            >
              <div className="d-flex align-items-center gap-2 justify-content-center">
                <AlertTriangle size={16} color="#F43F5E" />
                <span style={{ color: '#F43F5E', fontSize: '0.875rem' }}>{qrError}</span>
              </div>
              <button 
                onClick={handleRegenerateQR}
                className="btn btn-outline-glass btn-sm mt-2"
                style={{ fontSize: '0.75rem' }}
              >
                Try Again
              </button>
            </div>
          ) : qrCodeUrl ? (
            <div className="mb-3">
              <img 
                src={qrCodeUrl} 
                alt="Identity QR Code" 
                style={{ 
                  width: '200px', 
                  height: '200px',
                  borderRadius: '12px',
                  border: '4px solid white',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <p className="mt-2 mb-2" style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 500 }}>
                <Check size={14} className="me-1" /> QR Code Generated Successfully
              </p>
              <button 
                onClick={handleRegenerateQR}
                className="btn btn-outline-glass btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <RefreshCw size={14} className="me-1" /> Regenerate QR Code
              </button>
            </div>
          ) : (
            <div 
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ 
                width: '200px', 
                height: '200px', 
                background: 'white',
                borderRadius: '12px',
                padding: '12px'
              }}
            >
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  background: 'var(--navy-950)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <QrCode size={64} color="white" />
                <p className="mt-2 mb-0" style={{ color: 'white', fontSize: '0.625rem' }}>
                  Generating...
                </p>
              </div>
            </div>
          )}

          <div className="mb-3">
            <p className="mb-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
              Contains: Identity summary, reputation score, verification status
            </p>
            <p className="mb-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
              <Wallet size={12} className="me-1" />
              {accountId?.slice(0, 15)}...
            </p>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="d-flex align-items-center gap-2 mt-3">
        <Database size={14} color="var(--slate-500)" />
        <p className="m-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
          Cross-environment portability powered by Filecoin and World ID
        </p>
      </div>
    </div>
  );
}
