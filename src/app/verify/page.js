'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { quickVerify, verifyAction } from '@/lib/ai-verification';
import { notifyRewardReceived } from '@/lib/notifications';
import Link from 'next/link';
import { 
  Shield,
  Wallet,
  Brain,
  Check,
  AlertTriangle,
  ChevronLeft,
  Clock,
  MapPin,
  User,
  Award,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  X,
  FileCheck,
  Zap
} from 'lucide-react';

export default function VerifyPage() {
  const { isSignedIn, accountId, signIn } = useWallet();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      loadPendingVerifications();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const loadPendingVerifications = async () => {
    setLoading(true);
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          *,
          request:emergency_requests(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const responsesToVerify = [];
      for (const response of (responses || [])) {
        const { data: existingVerifications } = await supabase
          .from('action_verifications')
          .select('*')
          .eq('request_id', response.request_id)
          .eq('responder_wallet', response.responder_wallet);

        if (!existingVerifications || existingVerifications.length === 0) {
          responsesToVerify.push(response);
        }
      }

      setPendingVerifications(responsesToVerify);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (response) => {
    setVerifying(response.id);
    try {
      const { data: requester } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', response.request.requester_wallet)
        .single();

      const { data: responder } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', response.responder_wallet)
        .single();

      const result = await verifyAction(
        response.request,
        response,
        requester,
        responder,
        { mutualConfirmation: true }
      );

      const { data: verification, error } = await supabase
        .from('action_verifications')
        .insert({
          request_id: response.request_id,
          responder_wallet: response.responder_wallet,
          confidence_score: result.confidenceScore,
          verified: result.verified,
          verification_data: result
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('responses')
        .update({ status: result.verified ? 'confirmed' : 'rejected' })
        .eq('id', response.id);

      await supabase
        .from('emergency_requests')
        .update({ status: result.verified ? 'resolved' : 'open' })
        .eq('id', response.request_id);

      if (result.verified) {
        const { data: reward } = await supabase
          .from('rewards')
          .insert({
            wallet_address: response.responder_wallet,
            amount: 10,
            reason: 'Verified helpful action via AI'
          })
          .select()
          .single();

        await supabase
          .from('users')
          .update({ reputation: (responder?.reputation || 0) + 5 })
          .eq('wallet_address', response.responder_wallet);

        notifyRewardReceived(reward);
      }

      setVerificationResult({ response, result });
      setPendingVerifications(pendingVerifications.filter(r => r.id !== response.id));
    } catch (error) {
      console.error('Error verifying:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-vh-100 d-flex align-items-center" style={{ background: 'var(--navy-950)' }}>
        <div className="aurora-bg" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="glass-card p-5">
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Wallet size={36} color="#06B6D4" />
                </div>
                <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>Connect Your Wallet</h2>
                <p style={{ color: 'var(--slate-400)', marginBottom: '2rem' }}>
                  Create or import your Solana wallet to verify community actions.
                </p>
                <button onClick={signIn} className="btn btn-gradient btn-lg">
                  Import Wallet
                  <ArrowRight size={18} className="ms-2" />
                </button>
                <div className="mt-4">
                  <Link href="/" style={{ color: 'var(--cyan-400)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationResult) {
    const { response, result } = verificationResult;
    const isVerified = result.verified;
    const score = (result.confidenceScore * 100).toFixed(1);

    return (
      <div className="min-vh-100" style={{ background: 'var(--navy-950)' }}>
        <div className="aurora-bg" />
        
        <nav className="nav-premium" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-between py-3">
              <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
                <div style={{ 
                  background: 'var(--gradient-accent)', 
                  padding: '8px', 
                  borderRadius: '10px',
                  display: 'flex'
                }}>
                  <Shield size={24} color="white" />
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                  Proof-of-Action
                </span>
              </Link>
              <Link href="/dashboard" className="btn btn-outline-glass" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <ChevronLeft size={16} className="me-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="glass-card" style={{ borderColor: isVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)' }}>
                <div 
                  className="p-4"
                  style={{ 
                    background: isVerified 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
                    borderBottom: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}'` 
                  }}
                >
                  <h4 className="m-0 d-flex align-items-center gap-2" style={{ color: 'white' }}>
                    {isVerified ? (
                      <>
                        <Check size={24} color="#10B981" />
                        Verified!
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={24} color="#F59E0B" />
                        Manual Review Needed
                      </>
                    )}
                  </h4>
                </div>
                
                <div className="p-4">
                  <div className="text-center mb-5">
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%',
                      background: isVerified 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))'
                        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
                      border: `2px solid ${isVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      position: 'relative'
                    }}>
                      {isVerified ? (
                        <Check size={56} color="#10B981" />
                      ) : (
                        <ShieldCheck size={56} color="#F59E0B" />
                      )}
                      <div style={{ 
                        position: 'absolute',
                        bottom: '-8px',
                        background: isVerified ? '#10B981' : '#F59E0B',
                        color: isVerified ? 'white' : 'var(--navy-950)',
                        padding: '0.25rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}>
                        {score}%
                      </div>
                    </div>
                    <h3 style={{ color: isVerified ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                      Confidence Score
                    </h3>
                  </div>

                  <div className="glass-card mb-4" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                    <div className="p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <h5 className="m-0" style={{ color: 'white', fontWeight: 600 }}>Verification Breakdown</h5>
                    </div>
                    <div className="p-4">
                      <div className="row g-4">
                        {[
                          { label: 'Time Proximity', score: result.breakdown.timeScore, color: '#06B6D4' },
                          { label: 'Location Proximity', score: result.breakdown.locationScore, color: '#10B981' },
                          { label: 'Mutual Confirmation', score: result.breakdown.confirmationScore, color: '#8B5CF6' },
                          { label: 'Reputation', score: result.breakdown.reputationScore, color: '#F59E0B' }
                        ].map((item, i) => (
                          <div key={i} className="col-6">
                            <div className="d-flex justify-content-between mb-2">
                              <span style={{ color: 'var(--slate-300)', fontSize: '0.875rem' }}>{item.label}</span>
                              <span style={{ color: item.color, fontWeight: 700 }}>
                                {(item.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ 
                              height: '6px', 
                              background: 'rgba(255,255,255,0.1)', 
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${item.score * 100}%`,
                                  background: item.color,
                                  borderRadius: '3px',
                                  transition: 'width 0.5s ease'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {result.flags.length > 0 && (
                    <div className="glass-card mb-4" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
                      <div className="p-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <AlertTriangle size={18} color="#F59E0B" />
                        <h6 className="m-0" style={{ color: '#F59E0B' }}>Flags Detected</h6>
                      </div>
                      <div className="p-3">
                        <ul className="list-unstyled m-0">
                          {result.flags.map((flag, i) => (
                            <li key={i} className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--slate-300)' }}>
                              <X size={14} color="#F59E0B" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {isVerified && (
                    <div className="glass-card mb-4" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                      <div className="p-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <Award size={18} color="#10B981" />
                        <h6 className="m-0" style={{ color: '#10B981' }}>Rewards Issued</h6>
                      </div>
                      <div className="p-3">
                        <p className="m-0" style={{ color: 'var(--slate-300)' }}>
                          <strong className="token-badge me-2">
                            <TrendingUp size={12} />
                            10 Points
                          </strong>
                          and
                          <strong className="ms-2" style={{ color: '#10B981' }}>+5 Reputation</strong>
                          {' '}awarded to {response.responder_wallet.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-3 justify-content-center">
                    <button 
                      onClick={() => setVerificationResult(null)}
                      className="btn btn-gradient"
                    >
                      <FileCheck size={18} className="me-2" />
                      Verify Another
                    </button>
                    <Link href="/dashboard" className="btn btn-outline-glass">
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'var(--navy-950)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora-bg" />
      
      {/* Floating Elements */}
      <div 
        className="animate-float-slow"
        style={{
          position: 'fixed',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          top: '10%',
          right: '-100px',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      
      {/* Premium Navbar - Mobile Optimized */}
      <nav className="nav-premium" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container px-3 px-md-4">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
              <div 
                className="animate-pulse-glow"
                style={{ 
                  background: 'var(--gradient-accent)', 
                  padding: '10px', 
                  borderRadius: '12px',
                  display: 'flex'
                }}
              >
                <Shield size={24} color="white" />
              </div>
              <div className="d-none d-sm-block">
                <span style={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em'
                }}>
                  Proof-of-Action
                </span>
              </div>
              <div className="d-sm-none">
                <span style={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em'
                }}>
                  PoA
                </span>
              </div>
            </Link>
            
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <div className="wallet-chip d-none d-md-flex animate-reveal-scale">
                <Wallet size={14} />
                <span>{accountId?.slice(0, 8)}...</span>
              </div>
              <Link href="/dashboard" className="btn btn-outline-glass d-none d-sm-flex" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <ChevronLeft size={16} className="me-2" />
                Dashboard
              </Link>
              <Link href="/dashboard" className="btn btn-outline-glass d-sm-none" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                <ChevronLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-4 py-md-5 px-3 px-md-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header - Mobile Optimized */}
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 mb-md-5 gap-3 animate-reveal-down">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div 
                className="animate-bounce-subtle flex-shrink-0"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Brain size={20} color="#8B5CF6" />
              </div>
              <h2 className="m-0" style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>AI Verification</h2>
            </div>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              Verify community actions and prevent fraud.
            </p>
          </div>
          <button 
            onClick={loadPendingVerifications}
            className="btn btn-outline-glass d-flex align-items-center gap-2 flex-shrink-0"
            disabled={loading}
            style={{ padding: '0.5rem 1rem' }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5 animate-reveal-up">
            <div className="spinner-border" role="status" style={{ color: 'var(--cyan-400)', width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>Finding pending verifications...</p>
          </div>
        ) : pendingVerifications.length === 0 ? (
          <div className="glass-card p-4 p-md-5 text-center animate-reveal-scale">
            <div 
              className="animate-float mx-auto"
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <Sparkles size={36} color="#06B6D4" />
            </div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem', fontSize: '1.125rem' }}>No Pending Verifications</h4>
            <p className="mb-4" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              All community actions have been processed. Check back later!
            </p>
            <Link href="/dashboard" className="btn btn-gradient">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="card-grid stagger-children">
            {pendingVerifications.map((response, index) => (
              <div 
                key={response.id} 
                className="animate-reveal-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="glass-card h-100" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                  <div 
                    className="p-3 d-flex justify-content-between align-items-center"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                      borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }} className="d-flex align-items-center gap-2">
                      <Brain size={16} color="#8B5CF6" />
                      Pending Verification
                    </span>
                    <span style={{ 
                      background: 'rgba(15, 23, 42, 0.5)',
                      color: 'var(--slate-300)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem'
                    }}>
                      {new Date(response.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 p-md-4">
                    <h5 style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>
                      {response.request?.request_type}
                    </h5>
                    <p style={{ color: 'var(--slate-400)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      {response.request?.description || 'No description'}
                    </p>
                    
                    <div className="p-2 p-md-3 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <User size={12} color="var(--slate-500)" />
                        <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                          Requester: {response.request?.requester_wallet.slice(0, 12)}...
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Shield size={12} color="var(--slate-500)" />
                        <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                          Responder: {response.responder_wallet.slice(0, 12)}...
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={12} color="var(--slate-500)" />
                        <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                          Location: {response.request?.geohash.slice(0, 4)}...
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 p-md-4 pt-0">
                    <button
                      onClick={() => handleVerify(response)}
                      disabled={verifying === response.id}
                      className="btn btn-gradient w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      {verifying === response.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Brain size={16} />
                          <span>Run AI Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Info Card - Mobile Optimized */}
        <div 
          className="glass-card mt-4 mt-md-5 animate-reveal-up"
          style={{ background: 'rgba(139, 92, 246, 0.05)', animationDelay: '200ms' }}
        >
          <div className="p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-3 mb-md-4">
              <Zap size={18} color="#8B5CF6" />
              <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>How AI Verification Works</h5>
            </div>
            <div className="row g-3 g-md-4">
              <div className="col-md-6">
                <h6 style={{ color: 'white', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Verification Factors</h6>
                <ul className="list-unstyled" style={{ color: 'var(--slate-400)' }}>
                  {[
                    { label: 'Time Proximity', weight: '25%', desc: 'Response time after request' },
                    { label: 'Location Proximity', weight: '30%', desc: 'Geohash matching for privacy' },
                    { label: 'Mutual Confirmation', weight: '25%', desc: 'Both parties confirm completion' },
                    { label: 'Reputation Score', weight: '10%', desc: 'Historical trustworthiness' },
                    { label: 'Pattern Analysis', weight: '10%', desc: 'Fraud detection' }
                  ].map((item, i) => (
                    <li key={i} className="d-flex align-items-start gap-2 mb-2">
                      <Check size={14} color="#8B5CF6" className="mt-1 flex-shrink-0" />
                      <div>
                        <span style={{ color: 'var(--slate-300)', fontWeight: 500, fontSize: '0.8125rem' }}>{item.label}</span>
                        <span className="ms-1" style={{ color: '#8B5CF6', fontSize: '0.6875rem' }}>({item.weight})</span>
                        <p className="m-0" style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <h6 style={{ color: 'white', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Anti-Fraud Checks</h6>
                <ul className="list-unstyled" style={{ color: 'var(--slate-400)' }}>
                  {[
                    'Self-response detection',
                    'Suspicious speed analysis',
                    'Circular transaction detection',
                    'Volume anomaly detection',
                    'Geolocation consistency'
                  ].map((check, i) => (
                    <li key={i} className="d-flex align-items-center gap-2 mb-2">
                      <ShieldCheck size={14} color="#10B981" className="flex-shrink-0" />
                      <span style={{ fontSize: '0.8125rem' }}>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 mt-md-4 p-2 p-md-3 rounded" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                <strong style={{ color: '#8B5CF6' }}>Modular Design:</strong> The AI engine is built to be replaced 
                with ML models. Current implementation uses rule-based verification.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
