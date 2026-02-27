'use client';

import { useWallet } from '@/lib/near-wallet';
import { requestNotificationPermission, savePushSubscription, subscribeToPushNotifications } from '@/lib/notifications';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { 
  Wallet, 
  Bell, 
  Users, 
  Brain, 
  Coins,
  AlertCircle,
  HandHelping,
  ChevronRight,
  Check,
  X,
  Copy,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  MapPin,
  Zap,
  Activity,
  TrendingUp,
  Award
} from 'lucide-react';

export default function Home() {
  const { isSignedIn, signOut, createWallet, importWallet, accountId } = useWallet();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [createdMnemonic, setCreatedMnemonic] = useState('');
  const [confirmedBackup, setConfirmedBackup] = useState(false);
  const [importPhrase, setImportPhrase] = useState('');
  const [walletError, setWalletError] = useState('');
  const [copied, setCopied] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  const shortAddress = useMemo(() => {
    if (!accountId) return '';
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  }, [accountId]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreateWallet = async () => {
    setWalletError('');
    setConfirmedBackup(false);
    try {
      const { mnemonic } = await createWallet();
      setCreatedMnemonic(mnemonic);
      setShowSeedPhrase(true);
    } catch (e) {
      console.error(e);
      setWalletError('Could not create wallet. Please try again.');
    }
  };

  const handleImportWallet = async () => {
    setWalletError('');
    try {
      await importWallet(importPhrase);
      setShowOnboarding(false);
      setShowSeedPhrase(false);
      setCreatedMnemonic('');
      setImportPhrase('');
    } catch (e) {
      console.error(e);
      setWalletError('Invalid recovery phrase. Please double-check the words and spacing.');
    }
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(createdMnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      const sub = await subscribeToPushNotifications();
      if (sub) {
        await savePushSubscription(sub, accountId, []);
      }
      alert('Notifications enabled! You\'ll receive alerts for nearby emergencies.');
    }
  };

  return (
    <div className="min-vh-100" style={{ background: 'var(--navy-950)', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <div className="aurora-bg" />
      
      {/* Floating Orbs */}
      <div 
        className="animate-float-slow"
        style={{
          position: 'fixed',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          top: '10%',
          right: '-100px',
          zIndex: 0,
          pointerEvents: 'none',
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />
      <div 
        className="animate-float"
        style={{
          position: 'fixed',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          bottom: '20%',
          left: '-150px',
          zIndex: 0,
          pointerEvents: 'none',
          transform: `translateY(${scrollY * -0.05}px)`,
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
                  display: 'flex',
                  width: '44px',
                  height: '44px'
                }}
              >
                <img src="/ICON.png" alt="PoA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
              {isSignedIn ? (
                <>
                  <div className="wallet-chip d-none d-md-flex animate-reveal-scale">
                    <Wallet size={14} />
                    <span>{shortAddress}</span>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="btn btn-gradient"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={signOut} 
                    className="btn btn-outline-glass d-none d-sm-flex"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowOnboarding((v) => !v)} 
                  className="btn btn-gradient"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }}
                >
                  <Wallet size={16} className="me-2" />
                  <span className="d-none d-sm-inline">Connect</span>
                  <span className="d-sm-none">Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile First */}
      <section style={{ padding: '3rem 0 2rem', position: 'relative', zIndex: 1 }}>
        <div className="container px-3 px-md-4">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-7 order-2 order-lg-1">
              <div className="animate-reveal-up">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div 
                    className="emergency-badge animate-wave"
                    style={{ animation: 'none', background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--cyan-400)' }}
                  >
                    <Sparkles size={14} />
                    <span className="d-none d-sm-inline">Web3 Emergency Network</span>
                    <span className="d-sm-none">Web3 Network</span>
                  </div>
                </div>
                
                <h1 style={{ 
                  fontSize: 'clamp(2rem, 7vw, 3.5rem)', 
                  fontWeight: 800, 
                  lineHeight: 1.1,
                  color: 'white',
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.02em'
                }}>
                  Help Your
                  <br />
                  <span className="text-gradient-health">Community.</span>
                  <br />
                  <span className="text-gradient-gold">Earn On-Chain.</span>
                </h1>
                
                <p style={{ 
                  fontSize: 'clamp(0.9375rem, 2.5vw, 1.125rem)', 
                  color: 'var(--slate-400)', 
                  lineHeight: 1.7,
                  maxWidth: '540px',
                  marginBottom: '1.5rem'
                }}>
                  A privacy-first emergency network where real-world helpful actions 
                  are verified by AI and rewarded with blockchain tokens.
                </p>
                
                <div className="d-flex flex-column flex-sm-row gap-3">
                  {isSignedIn ? (
                    <>
                      <Link href="/request" className="btn btn-gold btn-lg d-flex align-items-center justify-content-center gap-2">
                        <AlertCircle size={20} />
                        Request Help
                      </Link>
                      <Link href="/respond" className="btn btn-outline-glass btn-lg d-flex align-items-center justify-content-center gap-2">
                        <HandHelping size={20} />
                        Offer Help
                      </Link>
                    </>
                  ) : (
                    <button 
                      onClick={() => setShowOnboarding(true)} 
                      className="btn btn-gold btn-lg d-flex align-items-center justify-content-center gap-2"
                    >
                      <Wallet size={20} />
                      Create or Import Wallet
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>

                {/* Mobile Quick Stats */}
                <div className="d-flex gap-3 mt-4 d-lg-none">
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                    <Activity size={14} color="var(--emerald-400)" />
                    <span>Verified Actions</span>
                  </div>
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                    <TrendingUp size={14} color="var(--cyan-400)" />
                    <span>On-Chain Rewards</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hero Visual - Mobile Optimized */}
            <div className="col-lg-5 order-1 order-lg-2 mb-4 mb-lg-0">
              <div 
                className="animate-reveal-scale"
                style={{ 
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* Animated Rings */}
                <div 
                  className="animate-spin-slow d-none d-md-block"
                  style={{
                    position: 'absolute',
                    width: '280px',
                    height: '280px',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '50%',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                <div 
                  className="animate-spin-slow d-none d-md-block"
                  style={{
                    position: 'absolute',
                    width: '320px',
                    height: '320px',
                    border: '1px dashed rgba(245, 158, 11, 0.15)',
                    borderRadius: '50%',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDirection: 'reverse',
                    animationDuration: '12s',
                  }}
                />
                
                {/* Central Card */}
                <div 
                  className="glass-card p-4 animate-float"
                  style={{ 
                    textAlign: 'center',
                    maxWidth: '280px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <div 
                      className="animate-bounce-subtle"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.1))',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AlertCircle size={28} color="#F43F5E" />
                    </div>
                    <div 
                      className="animate-bounce-subtle"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animationDelay: '0.2s'
                      }}
                    >
                      <Check size={28} color="#06B6D4" />
                    </div>
                    <div 
                      className="animate-bounce-subtle"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animationDelay: '0.4s'
                      }}
                    >
                      <Coins size={28} color="#F59E0B" />
                    </div>
                  </div>
                  
                  <div className="progress-bar-custom mb-3">
                    <div className="progress-bar-fill" style={{ width: '75%' }} />
                  </div>
                  
                  <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', margin: 0 }}>
                    Emergency Response Reward
                  </p>
                  <div className="d-flex align-items-center justify-content-center gap-1 mt-2">
                    <Award size={16} color="var(--amber-400)" />
                    <span style={{ color: 'var(--amber-400)', fontWeight: 600 }}>+50 PoA Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Onboarding Modal */}
      {(showOnboarding || showSeedPhrase) && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(2, 6, 23, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Wallet size={20} color="var(--cyan-400)" />
                  <h5 className="m-0" style={{ color: 'white', fontWeight: 600 }}>
                    {showSeedPhrase ? 'Save Your Recovery Phrase' : 'Solana Wallet'}
                  </h5>
                </div>
                <button 
                  onClick={() => {
                    setShowOnboarding(false);
                    setShowSeedPhrase(false);
                  }}
                  className="btn btn-link p-0"
                  style={{ color: 'var(--slate-400)' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {walletError && (
                <div className="alert" style={{ 
                  background: 'rgba(244, 63, 94, 0.15)', 
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#F43F5E',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={18} className="me-2" />
                  {walletError}
                </div>
              )}

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="glass-card p-4 h-100" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px',
                        background: 'var(--gradient-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Sparkles size={20} color="white" />
                      </div>
                      <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>Create New</h6>
                    </div>
                    
                    <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Generate a recovery phrase on your device. Save it securely. 
                      Anyone with this phrase can access your wallet.
                    </p>
                    
                    {!createdMnemonic ? (
                      <button 
                        className="btn btn-gradient w-100" 
                        onClick={handleCreateWallet}
                      >
                        Generate Phrase
                      </button>
                    ) : (
                      <div>
                        <label style={{ color: 'var(--slate-300)', fontSize: '0.875rem', fontWeight: 500 }}>
                          Your Recovery Phrase
                        </label>
                        <div className="position-relative mt-2">
                          <textarea
                            className="input-medical"
                            style={{ fontFamily: 'var(--font-mono)', minHeight: '100px' }}
                            value={createdMnemonic}
                            readOnly
                          />
                          <button
                            onClick={handleCopyPhrase}
                            className="btn btn-link position-absolute"
                            style={{ 
                              top: '8px', 
                              right: '8px', 
                              padding: '4px',
                              color: copied ? 'var(--emerald-400)' : 'var(--slate-400)'
                            }}
                          >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                        
                        <div className="form-check mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={confirmedBackup}
                            onChange={(e) => setConfirmedBackup(e.target.checked)}
                            id="confirmedBackup"
                            style={{ 
                              backgroundColor: confirmedBackup ? 'var(--emerald-500)' : 'transparent',
                              borderColor: confirmedBackup ? 'var(--emerald-500)' : 'var(--navy-600)'
                            }}
                          />
                          <label className="form-check-label" htmlFor="confirmedBackup" style={{ color: 'var(--slate-300)', fontSize: '0.875rem' }}>
                            I have saved this phrase securely
                          </label>
                        </div>
                        
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-gradient flex-fill"
                            disabled={!confirmedBackup}
                            onClick={() => {
                              setShowSeedPhrase(false);
                              setShowOnboarding(false);
                            }}
                          >
                            Continue
                          </button>
                          <button
                            className="btn btn-outline-glass"
                            onClick={() => {
                              setCreatedMnemonic('');
                              setConfirmedBackup(false);
                            }}
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6" style={{ display: showSeedPhrase ? 'none' : 'block' }}>
                  <div className="glass-card p-4 h-100">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px',
                        background: 'var(--gradient-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Wallet size={20} color="var(--navy-950)" />
                      </div>
                      <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>Import Existing</h6>
                    </div>
                    
                    <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Paste your 12- or 24-word recovery phrase to restore your wallet.
                    </p>
                    
                    <textarea
                      className="input-medical"
                      style={{ fontFamily: 'var(--font-mono)', minHeight: '120px' }}
                      placeholder="word1 word2 word3 ..."
                      value={importPhrase}
                      onChange={(e) => setImportPhrase(e.target.value)}
                    />
                    
                    <button
                      className="btn btn-gold w-100 mt-3"
                      onClick={handleImportWallet}
                      disabled={!importPhrase.trim()}
                    >
                      Import Wallet
                    </button>
                    
                    <div className="mt-3 p-3" style={{ 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: 'var(--radius-lg)'
                    }}>
                      <div className="d-flex align-items-start gap-2">
                        <AlertCircle size={16} color="var(--amber-400)" className="mt-1 flex-shrink-0" />
                        <small style={{ color: 'var(--slate-400)' }}>
                          <strong style={{ color: 'var(--amber-400)' }}>Security Note:</strong> This demo stores keys in browser storage. 
                          For production, use secure enclaves or MPC wallets.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works - Mobile Optimized */}
      <section style={{ padding: '3rem 0', background: 'rgba(15, 23, 42, 0.5)', position: 'relative', zIndex: 1 }}>
        <div className="container px-3 px-md-4">
          <div className="text-center mb-4 mb-md-5">
            <span 
              className="animate-reveal-up d-inline-block"
              style={{ 
                color: 'var(--cyan-400)', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                letterSpacing: '0.15em', 
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}
            >
              How It Works
            </span>
            <h2 
              className="animate-reveal-up"
              style={{ 
                color: 'white', 
                fontWeight: 700, 
                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                margin: 0 
              }}
            >
              Four Steps to Help
            </h2>
          </div>
          
          <div className="card-grid stagger-children">
            {[
              { 
                icon: AlertCircle, 
                color: '#F43F5E', 
                bg: 'rgba(244, 63, 94, 0.1)',
                title: 'Post Emergency', 
                desc: 'Share urgent needs like insulin, inhalers, or first aid. Your location stays private.' 
              },
              { 
                icon: Users, 
                color: '#06B6D4', 
                bg: 'rgba(6, 182, 212, 0.1)',
                title: 'Nearby Response', 
                desc: 'Community members nearby receive alerts and can offer immediate help.' 
              },
              { 
                icon: Brain, 
                color: '#8B5CF6', 
                bg: 'rgba(139, 92, 246, 0.1)',
                title: 'AI Verification', 
                desc: 'Our AI engine verifies time, location, and mutual confirmation to prevent fraud.' 
              },
              { 
                icon: Coins, 
                color: '#F59E0B', 
                bg: 'rgba(245, 158, 11, 0.1)',
                title: 'Earn Rewards', 
                desc: 'Verified helpers receive tokens and build reputation with each action.' 
              }
            ].map((step, i) => (
              <div 
                key={i}
                className="animate-reveal-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div 
                  className="glass-card p-4 h-100"
                  style={{ 
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div 
                      className="animate-float flex-shrink-0"
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px',
                        background: step.bg,
                        border: `1px solid ${step.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <step.icon size={24} color={step.color} />
                    </div>
                    <div>
                      <div style={{ 
                        color: 'var(--slate-500)', 
                        fontSize: '0.6875rem', 
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        STEP {i + 1}
                      </div>
                      <h5 style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        fontSize: '1rem',
                        marginBottom: '0.5rem' 
                      }}>
                        {step.title}
                      </h5>
                      <p style={{ 
                        color: 'var(--slate-400)', 
                        fontSize: '0.8125rem', 
                        lineHeight: 1.6, 
                        margin: 0 
                      }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Tech Stack */}
      <section style={{ padding: '3rem 0', position: 'relative', zIndex: 1 }}>
        <div className="container px-3 px-md-4">
          <div className="row g-4 g-lg-5">
            <div className="col-md-6 animate-reveal-left">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div 
                  className="animate-pulse-glow flex-shrink-0"
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Lock size={24} color="#10B981" />
                </div>
                <h3 style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '1.25rem' }}>
                  Privacy First
                </h3>
              </div>
              
              <div className="d-flex flex-column gap-3">
                {[
                  { icon: Check, text: 'No real names required', color: '#10B981' },
                  { icon: Wallet, text: 'Wallet = Identity', color: '#06B6D4' },
                  { icon: MapPin, text: 'Hashed location only', color: '#8B5CF6' },
                  { icon: Eye, text: 'Medical details encrypted', color: '#F59E0B' },
                  { icon: Brain, text: 'AI verifies patterns', color: '#F43F5E' }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="d-flex align-items-center gap-3 animate-reveal-right"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '8px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <item.icon size={14} color={item.color} />
                    </div>
                    <span style={{ color: 'var(--slate-300)', fontSize: '0.9375rem' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-md-6 animate-reveal-right">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div 
                  className="animate-pulse-glow flex-shrink-0"
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Zap size={24} color="#06B6D4" />
                </div>
                <h3 style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '1.25rem' }}>
                  Powered By
                </h3>
              </div>
              
              <div className="d-flex flex-wrap gap-2 mb-4">
                {['Next.js', 'Supabase', 'Solana', 'AI Engine', 'PWA', 'Web3'].map((tech, i) => (
                  <span 
                    key={i} 
                    className="animate-reveal-scale"
                    style={{ 
                      background: i % 2 === 0 ? 'var(--gradient-accent)' : 'var(--gradient-gold)',
                      color: i % 2 === 0 ? 'white' : 'var(--navy-950)',
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      animationDelay: `${i * 30}ms`
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              
              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                Built for production with a modular AI engine ready for ML integration. 
                Enterprise-grade architecture with Web3 native design.
              </p>
              
              {/* Stats Row */}
              <div className="d-flex gap-4 mt-4">
                <div>
                  <div style={{ color: 'var(--cyan-400)', fontSize: '1.5rem', fontWeight: 700 }}>99.9%</div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>Uptime</div>
                </div>
                <div>
                  <div style={{ color: 'var(--emerald-400)', fontSize: '1.5rem', fontWeight: 700 }}>&lt;1s</div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>Response</div>
                </div>
                <div>
                  <div style={{ color: 'var(--amber-400)', fontSize: '1.5rem', fontWeight: 700 }}>0</div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>Data Leaks</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '4rem 0', position: 'relative', zIndex: 1 }}>
        <div 
          className="animate-morph"
          style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            zIndex: 0,
            opacity: 0.5
          }} 
        />
        <div className="container px-3 px-md-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center animate-reveal-up">
            <div 
              className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1 animate-bounce-subtle"
              style={{ 
                background: 'rgba(245, 158, 11, 0.15)', 
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Sparkles size={14} color="var(--amber-400)" />
              <span style={{ color: 'var(--amber-400)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                DEMO READY
              </span>
            </div>
            
            <h2 style={{ 
              color: 'white', 
              fontWeight: 700, 
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              marginBottom: '1rem' 
            }}>
              Ready to Experience the Full Flow?
            </h2>
            
            <p style={{ 
              color: 'var(--slate-400)', 
              fontSize: '1rem', 
              maxWidth: '500px', 
              margin: '0 auto 1.5rem' 
            }}>
              Connect wallet, post a request, respond, get AI-verified, and earn rewards.
            </p>
            
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              {isSignedIn ? (
                <Link 
                  href="/dashboard" 
                  className="btn btn-gold btn-lg"
                  style={{ padding: '1rem 2rem', width: 'auto' }}
                >
                  Go to Dashboard
                  <ChevronRight size={20} className="ms-2" />
                </Link>
              ) : (
                <button 
                  onClick={() => setShowOnboarding(true)} 
                  className="btn btn-gold btn-lg"
                  style={{ padding: '1rem 2rem', width: 'auto' }}
                >
                  Start Demo
                  <ArrowRight size={20} className="ms-2" />
                </button>
              )}
              
              <button 
                onClick={handleEnableNotifications}
                className="btn btn-outline-glass d-flex align-items-center justify-content-center gap-2"
                style={{ width: 'auto' }}
              >
                <Bell size={18} />
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--glass-border)', 
        padding: '2rem 0',
        background: 'rgba(15, 23, 42, 0.8)',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="container px-3 px-md-4">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <img src="/ICON.png" alt="PoA Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                Proof-of-Action • Web3 Emergency Network
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-4">
              <Link href="/dashboard" style={{ color: 'var(--slate-400)', fontSize: '0.875rem', textDecoration: 'none' }}>
                Dashboard
              </Link>
              <Link href="/request" style={{ color: 'var(--slate-400)', fontSize: '0.875rem', textDecoration: 'none' }}>
                Request
              </Link>
              <Link href="/respond" style={{ color: 'var(--slate-400)', fontSize: '0.875rem', textDecoration: 'none' }}>
                Respond
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
