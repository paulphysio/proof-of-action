'use client';

import { useState, useEffect } from 'react';
import { Database, ExternalLink, Check, Clock, Shield } from 'lucide-react';
import { getFilecoinStorage } from '@/lib/filecoin';

/**
 * Filecoin Storage Status Component
 * Shows users their decentralized storage status
 * 
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 */

export default function FilecoinStorageStatus({ walletAddress }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilecoinStatus = async () => {
      try {
        setLoading(true);
        
        // Get Filecoin status from API route (server-side)
        const response = await fetch('/api/filecoin/store');
        const result = await response.json();
        
        // Get local storage records for UI display
        const localRecords = getFilecoinStorage();
        
        setStats({
          ...result,
          totalStored: localRecords.length,
          records: localRecords,
          isReal: result.success
        });
      } catch (error) {
        console.error('Failed to load Filecoin status:', error);
        setStats({
          success: false,
          error: error.message,
          totalStored: 0,
          records: [],
          isReal: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadFilecoinStatus();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="p-3 p-md-4">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span style={{ color: 'var(--slate-400)' }}>Loading Filecoin status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !stats.success) {
    return (
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="p-3 p-md-4">
          <div className="d-flex align-items-center gap-3">
            <Database size={24} color="#64748B" />
            <div>
              <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>Filecoin Storage</h6>
              <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {stats?.error || 'Storage unavailable'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.totalStored > 0;
  const isRealStorage = stats && stats.isReal;

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div 
        className="p-3 p-md-4"
        style={{ 
          background: hasData 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))' 
            : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))',
          borderBottom: hasData 
            ? '1px solid rgba(16, 185, 129, 0.2)' 
            : '1px solid rgba(100, 116, 139, 0.2)'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px',
              background: hasData ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: `2px solid ${hasData ? '#10B981' : '#64748B'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={24} color={hasData ? '#10B981' : '#64748B'} />
          </div>
          <div>
            <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>
              Filecoin Storage {isRealStorage && '✅'}
            </h6>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
              {isRealStorage ? 'Real decentralized storage' : 'Storage status'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 p-md-4">
        {hasData ? (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                Stored Items
              </span>
              <span style={{ color: 'white', fontWeight: 600 }}>
                {stats.totalStored}
              </span>
            </div>
            
            {isRealStorage && (
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                  USDFC Balance
                </span>
                <span style={{ color: 'white', fontWeight: 600 }}>
                  {stats.balance || '0'} USDFC
                </span>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between mb-3">
              <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                Network
              </span>
              <span style={{ color: 'white', fontWeight: 600 }}>
                {stats.network || 'Calibration'}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <Check size={16} color="#10B981" />
              <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {isRealStorage ? 'Decentralized storage active' : 'Storage ready'}
              </span>
            </div>

            {stats.records && stats.records.length > 0 && (
              <div className="mt-3">
                <h6 className="m-0 mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                  Recent Storage
                </h6>
                <div className="d-flex flex-column gap-2">
                  {stats.records.slice(-3).reverse().map((record, index) => (
                    <div 
                      key={index}
                      className="p-2 rounded"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                          {record.type || 'data'}
                        </span>
                        <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                          {new Date(record.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {record.pieceCid && (
                        <div className="mt-1">
                          <span style={{ color: 'var(--slate-500)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                            CID: {record.pieceCid.slice(0, 10)}...{record.pieceCid.slice(-8)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Database size={48} color="#64748B" className="mb-3" />
            <h6 className="m-0 mb-2" style={{ color: 'white', fontWeight: 600 }}>
              No Data Stored Yet
            </h6>
            <p className="m-0 mb-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              {isRealStorage 
                ? 'Complete World ID verification to store your first proof on Filecoin'
                : 'Start storing data to see it here'
              }
            </p>
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Shield size={16} color="#64748B" />
              <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {isRealStorage ? 'Decentralized storage ready' : 'Storage system ready'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
