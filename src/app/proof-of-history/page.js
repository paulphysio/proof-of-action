'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/near-wallet';
import { getFilecoinStorage, getFilecoinExplorerUrl, getIpfsUrl } from '@/lib/filecoin';
import { getWorldIDVerification } from '@/lib/worldid';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Database, 
  Shield, 
  Award, 
  Clock, 
  ExternalLink,
  FileCheck,
  TrendingUp,
  ChevronLeft,
  Loader2,
  Fingerprint,
  MapPin,
  Activity,
  CheckCircle2
} from 'lucide-react';

/**
 * Proof of History Dashboard
 * 
 * Displays verifiable history of all actions anchored on Filecoin
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 */

export default function ProofOfHistoryPage() {
  const { isSignedIn, accountId } = useWallet();
  const [filecoinStorage, setFilecoinStorage] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [worldIdStatus, setWorldIdStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActions: 0,
    verifiedActions: 0,
    totalPoints: 0,
    filecoinRecords: 0
  });

  useEffect(() => {
    loadProofOfHistory();
  }, [isSignedIn, accountId]);

  const loadProofOfHistory = async () => {
    setLoading(true);
    try {
      // Load Filecoin storage records
      const storage = getFilecoinStorage();
      setFilecoinStorage(storage);

      // Load World ID verification status
      const worldId = getWorldIDVerification();
      setWorldIdStatus(worldId);

      if (isSignedIn && accountId) {
        // Load verification history from Supabase
        const { data: verificationsData, error: verifError } = await supabase
          .from('action_verifications')
          .select(`
            *,
            request:emergency_requests(request_type, created_at)
          `)
          .eq('responder_wallet', accountId)
          .order('created_at', { ascending: false });

        if (!verifError && verificationsData) {
          setVerifications(verificationsData);
        }

        // Load user stats
        const { data: userData } = await supabase
          .from('users')
          .select('reputation')
          .eq('wallet_address', accountId)
          .single();

        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('amount')
          .eq('wallet_address', accountId);

        const totalPoints = rewardsData?.reduce((sum, r) => sum + r.amount, 0) || 0;

        setStats({
          totalActions: verificationsData?.length || 0,
          verifiedActions: verificationsData?.filter(v => v.verified).length || 0,
          totalPoints,
          filecoinRecords: storage.length
        });
      }
    } catch (error) {
      console.error('Error loading proof of history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--navy-950)' }}>
        <div className="text-center">
          <Loader2 size={48} color="#06B6D4" className="animate-spin mb-3" />
          <p style={{ color: 'var(--slate-400)' }}>Loading your proof of history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'var(--navy-950)' }}>
      {/* Navbar */}
      <nav className="nav-premium" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container px-3 px-md-4">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
              <div 
                style={{ 
                  background: 'var(--gradient-accent)', 
                  padding: '8px', 
                  borderRadius: '10px',
                  display: 'flex'
                }}
              >
                <Database size={24} color="white" />
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                Proof of History
              </span>
            </Link>
            <Link href="/dashboard" className="btn btn-outline-glass">
              <ChevronLeft size={16} className="me-2" />
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-5 px-3 px-md-4">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3" style={{ color: 'white' }}>
            Your Verifiable History
          </h1>
          <p className="lead mx-auto" style={{ color: 'var(--slate-400)', maxWidth: '600px' }}>
            Every action is permanently recorded on Filecoin, creating an immutable proof of your contributions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="glass-card p-4 text-center">
              <div 
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.15)'
                }}
              >
                <Activity size={28} color="#06B6D4" />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700 }}>{stats.totalActions}</h3>
              <p className="mb-0" style={{ color: 'var(--slate-400)' }}>Total Actions</p>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="glass-card p-4 text-center">
              <div 
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)'
                }}
              >
                <CheckCircle2 size={28} color="#10B981" />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700 }}>{stats.verifiedActions}</h3>
              <p className="mb-0" style={{ color: 'var(--slate-400)' }}>Verified Actions</p>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="glass-card p-4 text-center">
              <div 
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)'
                }}
              >
                <Award size={28} color="#F59E0B" />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700 }}>{stats.totalPoints}</h3>
              <p className="mb-0" style={{ color: 'var(--slate-400)' }}>Proof Points</p>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="glass-card p-4 text-center">
              <div 
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.15)'
                }}
              >
                <Database size={28} color="#8B5CF6" />
              </div>
              <h3 style={{ color: 'white', fontWeight: 700 }}>{stats.filecoinRecords}</h3>
              <p className="mb-0" style={{ color: 'var(--slate-400)' }}>Filecoin Records</p>
            </div>
          </div>
        </div>

        {/* World ID Status */}
        {worldIdStatus && (
          <div className="glass-card p-4 mb-5" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="d-flex align-items-center gap-3">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)'
                }}
              >
                <Fingerprint size={28} color="#10B981" />
              </div>
              <div>
                <h5 className="mb-1" style={{ color: 'white' }}>
                  World ID Verified
                </h5>
                <p className="mb-0" style={{ color: 'var(--slate-400)' }}>
                  Level: <span style={{ color: '#10B981', textTransform: 'capitalize' }}>{worldIdStatus.verification_level}</span>
                  {' • '}
                  Verified: {new Date(worldIdStatus.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="ms-auto">
                <Shield size={24} color="#10B981" />
              </div>
            </div>
          </div>
        )}

        {/* Filecoin Storage Records */}
        <div className="mb-5">
          <h4 className="mb-4" style={{ color: 'white' }}>
            <Database size={20} className="me-2" />
            Filecoin Anchored Records
          </h4>
          
          {filecoinStorage.length === 0 ? (
            <div className="glass-card p-5 text-center">
              <Database size={48} color="var(--slate-600)" className="mb-3" />
              <p style={{ color: 'var(--slate-400)' }}>
                No Filecoin records yet. Complete verified actions to create permanent proofs.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {filecoinStorage.map((record, index) => (
                <div key={index} className="col-12">
                  <div className="glass-card p-4">
                    <div className="d-flex flex-wrap align-items-center gap-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px',
                          background: record.network === 'filecoin_calibration' 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : 'rgba(100, 116, 139, 0.15)'
                        }}
                      >
                        {record.network === 'filecoin_calibration' ? (
                          <Database size={24} color="#10B981" />
                        ) : (
                          <Database size={24} color="#64748B" />
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span 
                            className="badge"
                            style={{ 
                              background: 'rgba(6, 182, 212, 0.2)',
                              color: '#06B6D4',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem'
                            }}
                          >
                            {record.type}
                          </span>
                          {record.network === 'filecoin_calibration' && (
                            <span 
                              className="badge"
                              style={{ 
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10B981',
                                fontSize: '0.75rem'
                              }}
                            >
                              Calibration
                            </span>
                          )}
                        </div>
                        <p className="mb-0 font-monospace" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                          CID: {record.cid}
                        </p>
                        <p className="mb-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <a 
                          href={getFilecoinExplorerUrl(record.cid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-glass btn-sm"
                        >
                          <ExternalLink size={14} className="me-1" />
                          Explorer
                        </a>
                        <a 
                          href={getIpfsUrl(record.cid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-glass btn-sm"
                        >
                          <ExternalLink size={14} className="me-1" />
                          IPFS
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification History */}
        <div>
          <h4 className="mb-4" style={{ color: 'white' }}>
            <FileCheck size={20} className="me-2" />
            AI Verification History
          </h4>
          
          {verifications.length === 0 ? (
            <div className="glass-card p-5 text-center">
              <FileCheck size={48} color="var(--slate-600)" className="mb-3" />
              <p style={{ color: 'var(--slate-400)' }}>
                No verifications yet. Respond to emergency requests to build your proof of history.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {verifications.map((verif) => (
                <div key={verif.id} className="col-12">
                  <div 
                    className="glass-card p-4"
                    style={{ 
                      borderLeft: `4px solid ${verif.verified ? '#10B981' : '#F43F5E'}` 
                    }}
                  >
                    <div className="d-flex flex-wrap align-items-start gap-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px',
                          background: verif.verified 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : 'rgba(244, 63, 94, 0.15)'
                        }}
                      >
                        {verif.verified ? (
                          <CheckCircle2 size={24} color="#10B981" />
                        ) : (
                          <TrendingUp size={24} color="#F43F5E" />
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span style={{ color: 'white', fontWeight: 600 }}>
                            {verif.request?.request_type || 'Emergency Request'}
                          </span>
                          <span 
                            className="badge"
                            style={{ 
                              background: verif.verified 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(244, 63, 94, 0.2)',
                              color: verif.verified ? '#10B981' : '#F43F5E',
                              fontSize: '0.75rem'
                            }}
                          >
                            {verif.verified ? 'Verified' : 'Rejected'}
                          </span>
                        </div>
                        
                        <div className="d-flex flex-wrap gap-3 mb-2" style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: 'var(--slate-400)' }}>
                            <Clock size={14} className="me-1" />
                            {new Date(verif.created_at).toLocaleDateString()}
                          </span>
                          <span style={{ color: 'var(--slate-400)' }}>
                            <TrendingUp size={14} className="me-1" />
                            Confidence: {(verif.confidence_score * 100).toFixed(1)}%
                          </span>
                          {verif.verification_data?.flags?.length > 0 && (
                            <span style={{ color: '#F59E0B' }}>
                              <Shield size={14} className="me-1" />
                              {verif.verification_data.flags.length} flags
                            </span>
                          )}
                        </div>
                        
                        {/* Verification Breakdown */}
                        {verif.verification_data?.breakdown && (
                          <div 
                            className="p-3 rounded mt-2"
                            style={{ 
                              background: 'rgba(15, 23, 42, 0.5)',
                              fontSize: '0.75rem'
                            }}
                          >
                            <div className="row g-2">
                              <div className="col-6 col-md-3">
                                <span style={{ color: 'var(--slate-500)' }}>Time Score:</span>
                                <br />
                                <span style={{ color: 'white' }}>
                                  {(verif.verification_data.breakdown.timeScore * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="col-6 col-md-3">
                                <span style={{ color: 'var(--slate-500)' }}>Location:</span>
                                <br />
                                <span style={{ color: 'white' }}>
                                  {(verif.verification_data.breakdown.locationScore * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="col-6 col-md-3">
                                <span style={{ color: 'var(--slate-500)' }}>Confirmation:</span>
                                <br />
                                <span style={{ color: 'white' }}>
                                  {(verif.verification_data.breakdown.confirmationScore * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="col-6 col-md-3">
                                <span style={{ color: 'var(--slate-500)' }}>Reputation:</span>
                                <br />
                                <span style={{ color: 'white' }}>
                                  {(verif.verification_data.breakdown.reputationScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-5 text-center">
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            <Database size={14} className="me-1" />
            All records are permanently stored on Filecoin Calibration Testnet
            <br />
            <Shield size={14} className="me-1" />
            Verified with World ID proof of personhood
          </p>
        </div>
      </div>
    </div>
  );
}
