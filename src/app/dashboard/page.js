'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState, useEffect } from 'react';
import { 
  getOrCreateUser, 
  getMyRequests, 
  getMyResponses, 
  getUserRewards,
  getUserReputation
} from '@/lib/supabase';
import Link from 'next/link';
import { 
  Shield, 
  Wallet, 
  Trophy, 
  Star, 
  ClipboardList, 
  HandHelping,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  Plus,
  Search,
  Award,
  TrendingUp,
  Home,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const { isSignedIn, accountId, signIn } = useWallet();
  const [user, setUser] = useState(null);
  const [reputation, setReputation] = useState(0);
  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn && accountId) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, accountId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await getOrCreateUser(accountId);
      setUser(userData);

      const [rep, myRequests, myResponses, myRewards] = await Promise.all([
        getUserReputation(accountId),
        getMyRequests(accountId),
        getMyResponses(accountId),
        getUserRewards(accountId)
      ]);

      setReputation(rep);
      setRequests(myRequests);
      setResponses(myResponses);
      setRewards(myRewards);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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
                  Create or import your Solana wallet to view your dashboard, reputation, and rewards.
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

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--navy-950)' }}>
        <div className="aurora-bg" />
        <div className="text-center" style={{ position: 'relative', zIndex: 1 }}>
          <div className="spinner-border" role="status" style={{ color: 'var(--cyan-400)', width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--slate-400)' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0);

  const metrics = [
    { 
      icon: Trophy, 
      label: 'Reputation', 
      value: reputation,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    { 
      icon: Coins, 
      label: 'Proof Points', 
      value: totalRewards,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    { 
      icon: ClipboardList, 
      label: 'My Requests', 
      value: requests.length,
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.1)'
    },
    { 
      icon: HandHelping, 
      label: 'Help Provided', 
      value: responses.length,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)'
    }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.3)' },
      in_progress: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)' },
      resolved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' },
      pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' },
      confirmed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' },
      completed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }
    };
    return styles[status] || styles.open;
  };

  return (
    <div className="min-vh-100" style={{ background: 'var(--navy-950)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora-bg" />
      
      {/* Floating Orbs */}
      <div 
        className="animate-float-slow"
        style={{
          position: 'fixed',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
          top: '15%',
          right: '-80px',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      
      {/* Premium Navbar */}
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
              <Link href="/" className="btn btn-outline-glass d-none d-sm-flex" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <Home size={16} className="me-2" />
                Home
              </Link>
              <Link href="/" className="btn btn-outline-glass d-sm-none" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                <Home size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-4 py-md-5 px-3 px-md-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Welcome Header - Mobile */}
        <div className="d-flex d-md-none align-items-center gap-3 mb-4 animate-reveal-down">
          <div 
            className="animate-float"
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px',
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={28} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', margin: 0 }}>
              Welcome back, {accountId?.slice(0, 6)}...
            </p>
          </div>
        </div>

        {/* Stats Row - Mobile Optimized */}
        <div className="row g-3 g-md-4 mb-4 mb-md-5 stagger-children">
          {metrics.map((metric, i) => (
            <div className="col-6 col-md-3" key={i}>
              <div 
                className="metric-card animate-reveal-up h-100"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="d-flex align-items-center gap-2 gap-md-3">
                  <div 
                    className="animate-bounce-subtle flex-shrink-0"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px',
                      background: metric.bg,
                      border: `1px solid ${metric.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <metric.icon size={20} color={metric.color} />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: 'clamp(1.25rem, 4vw, 2rem)', 
                      fontWeight: 700, 
                      color: metric.color,
                      lineHeight: 1
                    }}>
                      {metric.value}
                    </div>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                      {metric.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="glass-card p-3 p-md-4 mb-4 mb-md-5 animate-reveal-up">
          <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
            <h5 style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: '1rem' }}>Quick Actions</h5>
            <Activity size={18} color="var(--cyan-400)" />
          </div>
          <div className="d-flex flex-column flex-md-row gap-2 gap-md-3">
            <Link href="/request" className="btn btn-gold d-flex align-items-center justify-content-center gap-2">
              <Plus size={18} />
              <span className="d-none d-sm-inline">New Emergency Request</span>
              <span className="d-sm-none">New Request</span>
            </Link>
            <Link href="/respond" className="btn btn-gradient d-flex align-items-center justify-content-center gap-2">
              <Search size={18} />
              <span className="d-none d-sm-inline">Find Help Requests</span>
              <span className="d-sm-none">Find Help</span>
            </Link>
            <Link href="/verify" className="btn btn-outline-glass d-flex align-items-center justify-content-center gap-2">
              <Award size={18} />
              <span className="d-none d-sm-inline">Verify Actions</span>
              <span className="d-sm-none">Verify</span>
            </Link>
          </div>
        </div>

        <div className="row g-3 g-md-4">
          {/* My Requests - Mobile Optimized */}
          <div className="col-lg-6 animate-reveal-left" style={{ animationDelay: '100ms' }}>
            <div className="glass-card h-100">
              <div className="p-3 p-md-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="d-flex align-items-center gap-2">
                  <ClipboardList size={18} color="var(--cyan-400)" />
                  <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>My Requests</h5>
                </div>
              </div>
              <div className="p-0">
                {requests.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="animate-float" style={{ color: 'var(--slate-500)', marginBottom: '1rem' }}>
                      <ClipboardList size={40} opacity={0.3} />
                    </div>
                    <p style={{ color: 'var(--slate-400)', marginBottom: '1rem', fontSize: '0.875rem' }}>No requests yet.</p>
                    <Link href="/request" className="btn btn-gradient btn-sm">
                      <Plus size={14} className="me-2" />
                      Create Request
                    </Link>
                  </div>
                ) : (
                  <div className="list-group list-group-flush" style={{ background: 'transparent' }}>
                    {requests.slice(0, 5).map((request) => {
                      const badgeStyle = getStatusBadge(request.status);
                      return (
                        <div 
                          key={request.id} 
                          className="list-group-item"
                          style={{ 
                            background: 'transparent', 
                            borderColor: 'var(--glass-border)',
                            padding: '0.75rem 1rem'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="min-width-0">
                              <h6 style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {request.request_type}
                              </h6>
                              <p style={{ color: 'var(--slate-400)', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                                {request.description?.slice(0, 50)}{request.description?.length > 50 ? '...' : ''}
                              </p>
                              <div className="d-flex align-items-center gap-2">
                                <Clock size={12} color="var(--slate-500)" />
                                <small style={{ color: 'var(--slate-500)', fontSize: '0.6875rem' }}>
                                  {new Date(request.created_at).toLocaleDateString()}
                                </small>
                              </div>
                            </div>
                            <span 
                              className="badge flex-shrink-0"
                              style={{ 
                                background: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: badgeStyle.border,
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Help Actions - Mobile Optimized */}
          <div className="col-lg-6 animate-reveal-right" style={{ animationDelay: '200ms' }}>
            <div className="glass-card h-100">
              <div className="p-3 p-md-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="d-flex align-items-center gap-2">
                  <HandHelping size={18} color="var(--emerald-400)" />
                  <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>My Help Actions</h5>
                </div>
              </div>
              <div className="p-0">
                {responses.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="animate-float" style={{ color: 'var(--slate-500)', marginBottom: '1rem' }}>
                      <HandHelping size={40} opacity={0.3} />
                    </div>
                    <p style={{ color: 'var(--slate-400)', marginBottom: '1rem', fontSize: '0.875rem' }}>No help actions yet.</p>
                    <Link href="/respond" className="btn btn-gradient btn-sm">
                      <Search size={14} className="me-2" />
                      Find Help
                    </Link>
                  </div>
                ) : (
                  <div className="list-group list-group-flush" style={{ background: 'transparent' }}>
                    {responses.slice(0, 5).map((response) => {
                      const badgeStyle = getStatusBadge(response.status);
                      return (
                        <div 
                          key={response.id} 
                          className="list-group-item"
                          style={{ 
                            background: 'transparent', 
                            borderColor: 'var(--glass-border)',
                            padding: '0.75rem 1rem'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="min-width-0">
                              <h6 style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                Helped: {response.request?.request_type}
                              </h6>
                              <p style={{ color: 'var(--slate-400)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                {response.status}
                              </p>
                              <div className="d-flex align-items-center gap-2">
                                <Clock size={12} color="var(--slate-500)" />
                                <small style={{ color: 'var(--slate-500)', fontSize: '0.6875rem' }}>
                                  {new Date(response.created_at).toLocaleDateString()}
                                </small>
                              </div>
                            </div>
                            <span 
                              className="badge flex-shrink-0"
                              style={{ 
                                background: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: badgeStyle.border,
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              {response.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Rewards - Mobile Optimized */}
          <div className="col-12 animate-reveal-up" style={{ animationDelay: '300ms' }}>
            <div className="glass-card">
              <div className="p-3 p-md-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Star size={18} color="var(--amber-400)" />
                    <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Recent Rewards</h5>
                  </div>
                  <div className="token-badge animate-pulse-glow">
                    <TrendingUp size={12} />
                    <span>{totalRewards} Total</span>
                  </div>
                </div>
              </div>
              <div className="p-3 p-md-4">
                {rewards.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="animate-float" style={{ color: 'var(--slate-500)', marginBottom: '1rem' }}>
                      <Award size={40} opacity={0.3} />
                    </div>
                    <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                      No rewards yet. Complete verified actions to earn!
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table" style={{ color: 'var(--slate-300)', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderColor: 'var(--glass-border)' }}>
                          <th style={{ color: 'var(--slate-400)', fontWeight: 600, border: 'none', fontSize: '0.75rem' }}>Amount</th>
                          <th style={{ color: 'var(--slate-400)', fontWeight: 600, border: 'none', fontSize: '0.75rem' }}>Reason</th>
                          <th style={{ color: 'var(--slate-400)', fontWeight: 600, border: 'none', fontSize: '0.75rem' }} className="d-none d-sm-table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewards.slice(0, 10).map((reward) => (
                          <tr key={reward.id} style={{ borderColor: 'var(--glass-border)' }}>
                            <td style={{ border: 'none', padding: '0.75rem' }}>
                              <span className="token-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                <Plus size={10} />
                                {reward.amount}
                              </span>
                            </td>
                            <td style={{ color: 'var(--slate-200)', border: 'none', padding: '0.75rem', fontSize: '0.8125rem' }}>
                              {reward.reason}
                            </td>
                            <td style={{ color: 'var(--slate-500)', fontSize: '0.75rem', border: 'none', padding: '0.75rem' }} className="d-none d-sm-table-cell">
                              {new Date(reward.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
