'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink, Check, Clock, Award, TrendingUp, Users, Fingerprint } from 'lucide-react';
import { getFilecoinStorage } from '@/lib/filecoin';

/**
 * Agent Reputation & Portable Identity Component
 * Shows user's decentralized identity and reputation stored on Filecoin
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
        
        // Calculate reputation metrics
        const reputationRecords = localRecords.filter(r => r.type === 'reputation' || r.category === 'world-id-verification');
        const actionRecords = localRecords.filter(r => r.type === 'movement_proof' || r.category === 'emergency-response');
        const identityRecords = localRecords.filter(r => r.type === 'verification_proof' || r.category === 'world-id-verification');
        
        setStats({
          ...result,
          totalStored: localRecords.length,
          records: localRecords,
          isReal: result.success,
          reputationScore: calculateReputationScore(reputationRecords, actionRecords),
          identityProofs: identityRecords.length,
          actionProofs: actionRecords.length,
          verificationLevel: getVerificationLevel(identityRecords)
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
  }, []);

  // Calculate reputation score based on stored proofs
  const calculateReputationScore = (reputationRecords, actionRecords) => {
    const baseScore = reputationRecords.length * 10; // 10 points per verification
    const actionScore = actionRecords.reduce((score, record) => {
      const confidence = record.metadata?.confidence || 0.5;
      return score + Math.round(confidence * 20); // Up to 20 points per action
    }, 0);
    return Math.min(baseScore + actionScore, 100); // Max 100 points
  };

  // Get verification level from identity records
  const getVerificationLevel = (identityRecords) => {
    const latestRecord = identityRecords[0];
    return latestRecord?.metadata?.verificationLevel || 'none';
  };

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

  const hasIdentity = stats && stats.verificationLevel !== 'none';
  const hasReputation = stats && stats.reputationScore > 0;
  const isRealStorage = stats && stats.isReal;

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Header - Agent Identity */}
      <div 
        className="p-3 p-md-4"
        style={{ 
          background: hasIdentity && hasReputation
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(139, 92, 246, 0.05))' 
            : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))',
          borderBottom: hasIdentity && hasReputation
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
              background: hasIdentity && hasReputation ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: `2px solid ${hasIdentity && hasReputation ? '#8B5CF6' : '#64748B'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Fingerprint size={24} color={hasIdentity && hasReputation ? '#8B5CF6' : '#64748B'} />
          </div>
          <div>
            <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>
              Agent Identity & Reputation {isRealStorage && '✅'}
            </h6>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
              {hasIdentity ? `Verified ${stats.verificationLevel}` : 'Portable identity system'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 p-md-4">
        {hasIdentity || hasReputation ? (
          <div>
            {/* Reputation Score */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                  Agent Reputation Score
                </span>
                <div className="d-flex align-items-center gap-1">
                  <TrendingUp size={14} color="#8B5CF6" />
                  <span style={{ color: '#8B5CF6', fontWeight: 700 }}>
                    {stats?.reputationScore || 0}/100
                  </span>
                </div>
              </div>
              <div className="progress" style={{ height: '8px', background: 'rgba(139, 92, 246, 0.2)' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${stats?.reputationScore || 0}%`,
                    background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Storage Stats */}
            <div className="mb-4">
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
            </div>

            {/* Identity & Action Metrics */}
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="text-center p-3 rounded" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Fingerprint size={20} color="#8B5CF6" className="mb-2" />
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                    {stats?.identityProofs || 0}
                  </div>
                  <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                    Identity Proofs
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Award size={20} color="#10B981" className="mb-2" />
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                    {stats?.actionProofs || 0}
                  </div>
                  <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                    Action Proofs
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Proofs */}
            <div>
              <h6 className="m-0 mb-3" style={{ color: 'white', fontWeight: 600 }}>
                Recent Proofs (Filecoin Anchored)
              </h6>
              <div className="d-flex flex-column gap-2">
                {stats?.records?.slice(0, 3).map((record, index) => (
                  <div 
                    key={index}
                    className="p-2 rounded"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        {record.type === 'verification_proof' || record.category === 'world-id-verification' ? (
                          <Fingerprint size={14} color="#8B5CF6" />
                        ) : (
                          <Award size={14} color="#10B981" />
                        )}
                        <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                          {record.type === 'verification_proof' ? 'Identity Proof' : 
                           record.type === 'movement_proof' ? 'Action Proof' : 'Reputation'}
                        </span>
                      </div>
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
          </div>
        ) : (
          <div className="text-center">
            <Fingerprint size={48} color="#64748B" className="mb-3" />
            <h6 className="m-0 mb-2" style={{ color: 'white', fontWeight: 600 }}>
              Build Your Agent Identity
            </h6>
            <p className="m-0 mb-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              {isRealStorage 
                ? 'Complete World ID verification and emergency responses to build your portable reputation'
                : 'Start building your tamper-resistant identity on Filecoin'
              }
            </p>
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Shield size={16} color="#64748B" />
              <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {isRealStorage ? 'Decentralized identity ready' : 'Identity system ready'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
