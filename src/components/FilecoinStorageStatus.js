'use client';

import { useState, useEffect } from 'react';
import { Database, ExternalLink, Check, Clock, Shield } from 'lucide-react';
import { getFilecoinStorageStats, isFilecoinAvailable } from '@/lib/filecoin';

/**
 * Filecoin Storage Status Component
 * Shows users their decentralized storage status
 * 
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 */

export default function FilecoinStorageStatus({ walletAddress }) {
  const [stats, setStats] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(isFilecoinAvailable());
    setStats(getFilecoinStorageStats());
  }, []);

  if (!isAvailable) {
    return null;
  }

  const hasData = stats && stats.totalStored > 0;

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
            <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
              Filecoin Storage
            </h5>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
              {hasData ? 'Data anchored on-chain' : 'Decentralized storage ready'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 p-md-4">
        {hasData ? (
          <>
            {/* Stats Grid */}
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ color: '#10B981', fontWeight: 700, fontSize: '1.25rem' }}>
                    {stats.totalStored}
                  </div>
                  <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem' }}>
                    Records Stored
                  </small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ color: '#06B6D4', fontWeight: 700, fontSize: '1.25rem' }}>
                    {stats.reputationRecords}
                  </div>
                  <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem' }}>
                    Reputation
                  </small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '1.25rem' }}>
                    {stats.trackingRecords}
                  </div>
                  <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem' }}>
                    Tracking
                  </small>
                </div>
              </div>
            </div>

            {/* Last Stored */}
            {stats.lastStored && (
              <div 
                className="p-2 rounded mb-3"
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Clock size={14} color="#10B981" />
                  <small style={{ color: '#10B981', fontSize: '0.75rem' }}>
                    Last stored: {new Date(stats.lastStored).toLocaleDateString()}
                  </small>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="mb-3">
              <h6 className="mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                <Shield size={14} className="me-1" />
                Verifiable Benefits:
              </h6>
              <ul className="list-unstyled m-0" style={{ color: 'var(--slate-400)' }}>
                {[
                  'CID-rooted portable identity',
                  'Tamper-resistant reputation',
                  'Cross-network verification',
                  'Proof of help history'
                ].map((benefit, i) => (
                  <li key={i} className="d-flex align-items-start gap-2 mb-1">
                    <Check size={12} color="#10B981" className="flex-shrink-0 mt-1" />
                    <span style={{ fontSize: '0.75rem' }}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Empty State */}
            <div className="text-center py-3">
              <Database size={32} color="#64748B" className="mb-2" />
              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                No data stored yet
              </p>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                Complete help actions to store movement data on Filecoin
              </p>
            </div>

            {/* Features */}
            <div className="mt-3">
              <h6 className="mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                What Gets Stored:
              </h6>
              <ul className="list-unstyled m-0" style={{ color: 'var(--slate-400)' }}>
                {[
                  'Movement tracking verification',
                  'Reputation scores',
                  'Help action history',
                  'Portable identity anchor'
                ].map((item, i) => (
                  <li key={i} className="d-flex align-items-start gap-2 mb-1">
                    <div 
                      style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        background: '#64748B',
                        marginTop: '6px'
                      }} 
                    />
                    <span style={{ fontSize: '0.75rem' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Learn More Link */}
        <a 
          href="https://filecoin.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="d-flex align-items-center justify-content-center gap-2 mt-3"
          style={{ 
            color: 'var(--cyan-400)', 
            fontSize: '0.75rem',
            textDecoration: 'none'
          }}
        >
          Learn about Filecoin
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
