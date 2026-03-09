'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink, Check, Clock, Award, TrendingUp, Users, Fingerprint, Server, Globe } from 'lucide-react';
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
  const [providers, setProviders] = useState([]);
  const [showProviders, setShowProviders] = useState(false);

  useEffect(() => {
    const loadFilecoinStatus = async () => {
      try {
        setLoading(true);
        
        // Get Filecoin status from API route (server-side)
        const response = await fetch('/api/filecoin/store');
        const result = await response.json();
        
        // Get local storage records for UI display
        const localRecords = getFilecoinStorage();
        
        // Load storage providers from API route
        let providersList = [];
        try {
          const providersResponse = await fetch('/api/filecoin/providers');
          const providersResult = await providersResponse.json();
          if (providersResult.success) {
            providersList = providersResult.providers || [];
          }
        } catch (providersError) {
          console.warn('Failed to load storage providers:', providersError);
          providersList = [];
        }
        setProviders(providersList);
        
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
    // Base score from identity verifications (World ID)
    const identityScore = reputationRecords.length * 15; // 15 points per verification
    
    // Action score from emergency responses and movement proofs
    const actionScore = actionRecords.reduce((score, record) => {
      const confidence = record.metadata?.confidence || 0.5;
      const urgencyBonus = record.metadata?.urgencyLevel === 'critical' ? 10 : 
                          record.metadata?.urgencyLevel === 'high' ? 5 : 0;
      return score + Math.round(confidence * 25) + urgencyBonus; // Up to 35 points per action
    }, 0);
    
    // Verification level bonus
    const verificationLevel = getVerificationLevel(reputationRecords);
    const levelBonus = verificationLevel === 'orb' ? 20 : 
                       verificationLevel === 'deviceLegacy' ? 10 : 0;
    
    // Total score with maximum of 100
    const totalScore = Math.min(identityScore + actionScore + levelBonus, 100);
    
    return Math.max(0, totalScore); // Ensure non-negative
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

  // Get reputation level based on score
  const getReputationLevel = (score) => {
    if (score >= 80) return { level: 'Trusted Responder', color: '#10B981', icon: '🏆' };
    if (score >= 60) return { level: 'Verified Helper', color: '#06B6D4', icon: '⭐' };
    if (score >= 40) return { level: 'Rising Hero', color: '#8B5CF6', icon: '🌟' };
    if (score >= 20) return { level: 'Newcomer', color: '#F59E0B', icon: '🌱' };
    return { level: 'Getting Started', color: '#64748B', icon: '🔰' };
  };

  const hasIdentity = stats && stats.verificationLevel !== 'none';
  const hasReputation = stats && stats.reputationScore > 0;
  const isRealStorage = stats && stats.isReal;
  const reputationLevel = getReputationLevel(stats?.reputationScore || 0);

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
            <div className="d-flex align-items-center gap-2">
              {hasReputation && (
                <div 
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded"
                  style={{ 
                    background: `${reputationLevel.color}20`,
                    border: `1px solid ${reputationLevel.color}`,
                    fontSize: '0.75rem'
                  }}
                >
                  <span>{reputationLevel.icon}</span>
                  <span style={{ color: reputationLevel.color, fontWeight: 600 }}>
                    {reputationLevel.level}
                  </span>
                </div>
              )}
              <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                {hasIdentity ? `Verified ${stats.verificationLevel}` : 'Portable identity system'}
              </p>
            </div>
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

            {/* Storage Stats - User Friendly */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                  Identity Proofs Stored
                </span>
                <span style={{ color: 'white', fontWeight: 600 }}>
                  {stats.totalStored}
                </span>
              </div>
              
              {isRealStorage && (
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                    Storage Network
                  </span>
                  <div className="d-flex align-items-center gap-1">
                    <Shield size={12} color="#10B981" />
                    <span style={{ color: '#10B981', fontSize: '0.75rem' }}>
                      Filecoin Active
                    </span>
                  </div>
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

            {/* Recent Proofs - User Friendly */}
            <div>
              <h6 className="m-0 mb-3" style={{ color: 'white', fontWeight: 600 }}>
                Your Recent Identity Actions
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
                          {record.type === 'verification_proof' ? 'Identity Verified' : 
                           record.type === 'movement_proof' ? 'Emergency Response' : 
                           record.type === 'response_commitment' ? 'Commitment Made' : 'Reputation Built'}
                        </span>
                      </div>
                      <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {record.pieceCid && (
                      <div className="mt-1">
                        <span style={{ color: 'var(--slate-500)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          ✅ Secured on Filecoin
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
              Build Your Portable Identity
            </h6>
            <p className="m-0 mb-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              Complete World ID verification and respond to emergencies to build your reputation
            </p>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Fingerprint size={16} color="#8B5CF6" />
                <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                  Verify your identity with World ID
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Award size={16} color="#10B981" />
                <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                  Respond to emergency requests
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
