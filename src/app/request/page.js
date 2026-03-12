'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState } from 'react';
import { createEmergencyRequest, getOrCreateUser } from '@/lib/supabase';
import { generateGeohash } from '@/lib/ai-verification';
import { notifyNearbyEmergency } from '@/lib/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wallet,
  Pill,
  Stethoscope,
  Utensils,
  Home,
  Car,
  AlertTriangle,
  MapPin,
  Check,
  ArrowRight,
  Loader2,
  X,
  Lock,
  Clock,
  ChevronLeft,
  FileText,
  Navigation
} from 'lucide-react';

const REQUEST_TYPES = [
  { 
    value: 'medication', 
    icon: Pill,
    label: 'Medication', 
    labelMobile: 'Medication',
    desc: 'Insulin, inhalers, epipens',
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.1)'
  },
  { 
    value: 'medical_supplies', 
    icon: Stethoscope,
    label: 'Medical Supplies', 
    labelMobile: 'Med Supplies',
    desc: 'Bandages, first aid items',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.1)'
  },
  { 
    value: 'food', 
    icon: Utensils,
    label: 'Food/Water', 
    labelMobile: 'Food/Water',
    desc: 'Emergency food supplies',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  { 
    value: 'shelter', 
    icon: Home,
    label: 'Temporary Shelter', 
    labelMobile: 'Shelter',
    desc: 'Emergency accommodation',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)'
  },
  { 
    value: 'transport', 
    icon: Car,
    label: 'Emergency Transport', 
    labelMobile: 'Transport',
    desc: 'Ride to medical facility',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  { 
    value: 'other', 
    icon: AlertTriangle,
    label: 'Other Emergency', 
    labelMobile: 'Other',
    desc: 'Other urgent needs',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.1)'
  }
];

export default function RequestPage() {
  const { isSignedIn, accountId, signIn } = useWallet();
  const router = useRouter();
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        (err) => {
          setError('Could not get location: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const requestLocationPermission = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lon);
          resolve({ lat, lon });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleSubmitClick = async (e) => {
    e.preventDefault();
    
    // If location is not set, show the location prompt first
    if (!latitude || !longitude) {
      setPendingSubmit(true);
      setShowLocationPrompt(true);
      return;
    }
    
    // Otherwise proceed with submit
    await doSubmit();
  };

  const confirmLocationAndSubmit = async () => {
    try {
      await requestLocationPermission();
      setShowLocationPrompt(false);
      if (pendingSubmit) {
        await doSubmit();
        setPendingSubmit(false);
      }
    } catch (error) {
      setError('Location access is required to post emergency requests. This helps responders find you. Please enable location permissions.');
    }
  };

  const doSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await getOrCreateUser(accountId);
      const lat = parseFloat(latitude) || 40.7128;
      const lon = parseFloat(longitude) || -74.0060;
      const geohash = generateGeohash(lat, lon, 6);

      const request = await createEmergencyRequest(
        accountId,
        REQUEST_TYPES.find(t => t.value === requestType)?.label || requestType,
        description,
        geohash
      );

      if (request) {
        setSuccess(true);
        notifyNearbyEmergency(request);

        const prefix = typeof request.geohash === 'string' ? request.geohash.slice(0, 3) : null;
        if (prefix) {
          fetch('/api/push/notify-nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request, geohashPrefixes: [prefix] })
          }).catch(() => {});
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError('Failed to create request. Please try again.');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError('An error occurred. Please try again.');
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
                  Create or import your Solana wallet to post emergency requests.
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

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center" style={{ background: 'var(--navy-950)' }}>
        <div className="aurora-bg" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="glass-card p-5" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Check size={48} color="#10B981" />
                </div>
                <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>Request Posted!</h2>
                <p style={{ color: 'var(--slate-400)', marginBottom: '2rem' }}>
                  Your emergency request has been posted. Nearby users will be notified.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <Link href="/dashboard" className="btn btn-gradient">
                    Go to Dashboard
                  </Link>
                  <Link href="/" className="btn btn-outline-glass">
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

  const selectedType = REQUEST_TYPES.find(t => t.value === requestType);

  return (
    <div className="min-vh-100" style={{ background: 'var(--navy-950)', position: 'relative', overflow: 'hidden' }}>
      <div className="aurora-bg" />
      
      {/* Floating Elements */}
      <div 
        className="animate-float-slow"
        style={{
          position: 'fixed',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)',
          top: '10%',
          right: '-50px',
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
                  fontSize: '0.875rem',
                  letterSpacing: '-0.02em'
                }}>
                  Proof-of-Action
                </span>
              </div>
              <div className="d-sm-none">
                <span style={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '0.8125rem',
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
              <Link href="/dashboard" className="btn btn-outline-glass d-none d-sm-flex" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                <ChevronLeft size={16} className="me-2" />
                Dashboard
              </Link>
              <Link href="/dashboard" className="btn btn-outline-glass d-sm-none" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                <ChevronLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-4 py-md-5 px-3 px-md-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="glass-card overflow-hidden animate-reveal-up">
              {/* Header - Mobile Optimized */}
              <div className="p-3 p-md-4" style={{ 
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.05))',
                borderBottom: '1px solid rgba(244, 63, 94, 0.2)'
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="animate-bounce-subtle flex-shrink-0"
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3), rgba(244, 63, 94, 0.1))',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AlertTriangle size={22} color="#F43F5E" />
                  </div>
                  <div>
                    <h4 className="m-0" style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>Emergency Request</h4>
                    <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                      Get help from your community
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 p-md-4">
                {error && (
                  <div className="alert mb-4 animate-reveal-down" style={{ 
                    background: 'rgba(244, 63, 94, 0.15)', 
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#F43F5E',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem'
                  }}>
                    <AlertTriangle size={18} className="me-2" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitClick}>
                  {/* Step 1: Request Type - Mobile Optimized */}
                  <div className="mb-4 mb-md-5">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div 
                        className="animate-pulse-glow flex-shrink-0"
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%',
                          background: selectedType ? 'var(--emerald-500)' : 'var(--cyan-500)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'white'
                        }}
                      >
                        {selectedType ? <Check size={16} /> : '1'}
                      </div>
                      <label style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                        What do you need?
                      </label>
                    </div>
                    
                    <div className="row g-2">
                      {REQUEST_TYPES.map((type) => (
                        <div key={type.value} className="col-12 col-sm-6">
                          <div 
                            className="glass-card p-2 p-sm-3 animate-reveal-scale"
                            onClick={() => setRequestType(type.value)}
                            style={{ 
                              cursor: 'pointer',
                              border: requestType === type.value 
                                ? `2px solid ${type.color}` 
                                : '1px solid var(--glass-border)',
                              background: requestType === type.value 
                                ? type.bg 
                                : 'var(--glass-bg)',
                              animationDelay: `${REQUEST_TYPES.indexOf(type) * 50}ms`,
                              minHeight: '68px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 gap-sm-3 w-100">
                              <div 
                                className="animate-float flex-shrink-0"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  borderRadius: '10px',
                                  background: type.bg,
                                  border: `1px solid ${type.color}40`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <type.icon size={20} color={type.color} />
                              </div>
                              <div className="flex-grow-1 min-width-0">
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="radio"
                                    name="requestType"
                                    checked={requestType === type.value}
                                    onChange={() => setRequestType(type.value)}
                                    className="flex-shrink-0"
                                    style={{ 
                                      accentColor: type.color,
                                      width: '18px',
                                      height: '18px',
                                      margin: 0
                                    }}
                                  />
                                  <span 
                                    style={{ 
                                      color: 'white', 
                                      fontWeight: 600, 
                                      fontSize: '0.8125rem',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {/* Show mobile label on xs, full label on sm+ */}
                                    <span className="d-inline d-sm-none">{type.labelMobile}</span>
                                    <span className="d-none d-sm-inline">{type.label}</span>
                                  </span>
                                </div>
                                <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.625rem', lineHeight: 1.3 }}>
                                  {type.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Description - Mobile Optimized */}
                  <div className="mb-4 mb-md-5 animate-reveal-left" style={{ animationDelay: '100ms' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div 
                        className="animate-pulse-glow flex-shrink-0"
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%',
                          background: description ? 'var(--emerald-500)' : 'var(--slate-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'white'
                        }}
                      >
                        {description ? <Check size={16} /> : '2'}
                      </div>
                      <label style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                        Additional Details
                      </label>
                      <span className="ms-auto" style={{ color: 'var(--slate-500)', fontSize: '0.6875rem' }}>
                        (Optional)
                      </span>
                    </div>
                    
                    <textarea
                      className="input-medical"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., 'Need insulin within 2 hours, can meet at pharmacy'"
                    />
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <Lock size={12} color="var(--slate-500)" />
                      <small style={{ color: 'var(--slate-500)', fontSize: '0.6875rem' }}>
                        Never share personal medical details. Keep it brief and safe.
                      </small>
                    </div>
                  </div>

                  {/* Step 3: Location - Mobile Optimized */}
                  <div className="mb-4 mb-md-5 animate-reveal-left" style={{ animationDelay: '200ms' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div 
                        className="animate-pulse-glow flex-shrink-0"
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%',
                          background: (latitude && longitude) ? 'var(--emerald-500)' : 'var(--slate-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'white'
                        }}
                      >
                        {(latitude && longitude) ? <Check size={16} /> : '3'}
                      </div>
                      <label style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                        Your Location
                      </label>
                    </div>
                    
                    <div className="row g-2 g-md-3 mb-3">
                      <div className="col-6 col-md-6">
                        <div className="position-relative">
                          <MapPin size={14} color="var(--slate-500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            className="input-medical"
                            style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
                            placeholder="Latitude"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-6 col-md-6">
                        <div className="position-relative">
                          <MapPin size={14} color="var(--slate-500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            className="input-medical"
                            style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
                            placeholder="Longitude"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex flex-column flex-sm-row gap-3">
                      <button
                        type="button"
                        className="btn btn-gradient d-flex align-items-center justify-content-center gap-2"
                        onClick={handleGetLocation}
                      >
                        <Navigation size={16} className="me-2" />
                        Get My Location
                      </button>
                      <div className="d-flex align-items-center gap-2">
                        <Lock size={14} color="var(--slate-500)" />
                        <small style={{ color: 'var(--slate-500)', fontSize: '0.6875rem' }}>
                          Location is hashed for privacy
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Notice - Mobile Optimized */}
                  <div 
                    className="glass-card p-3 p-md-4 mb-4 animate-reveal-up"
                    style={{ background: 'rgba(6, 182, 212, 0.05)', animationDelay: '300ms' }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div 
                        className="animate-float flex-shrink-0"
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '10px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Lock size={18} color="var(--cyan-400)" />
                      </div>
                      <div>
                        <h6 style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          Privacy Protected
                        </h6>
                        <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.6875rem', lineHeight: 1.6 }}>
                          Location is stored as geohash (approximate area), not exact coordinates. 
                          Your wallet is your only identifier.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons - Mobile Optimized */}
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <button
                      type="submit"
                      className="btn btn-gold btn-lg d-flex align-items-center justify-content-center gap-2"
                      disabled={loading || !requestType}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={20} />
                          Post Emergency Request
                        </>
                      )}
                    </button>
                    <Link href="/dashboard" className="btn btn-outline-glass btn-lg d-flex align-items-center justify-content-center">
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission Modal */}
      {showLocationPrompt && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            background: 'rgba(15, 23, 42, 0.9)', 
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="glass-card p-4 p-md-5 mx-3 animate-reveal-scale"
            style={{ maxWidth: '450px', width: '100%' }}
          >
            <div className="text-center mb-4">
              <div 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.1))',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}
              >
                <MapPin size={32} color="#F43F5E" />
              </div>
              <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.75rem' }}>
                Location Required
              </h4>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                To post emergency requests, we need your location so nearby helpers can find you. Your exact location is never shared directly.
              </p>
            </div>
            
            <div className="d-flex flex-column gap-3">
              <button 
                onClick={confirmLocationAndSubmit}
                className="btn btn-gold w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ padding: '0.875rem' }}
              >
                <Navigation size={18} />
                Enable Location & Post
              </button>
              <button 
                onClick={() => {
                  setShowLocationPrompt(false);
                  setPendingSubmit(false);
                }}
                className="btn btn-outline-glass w-100"
                style={{ padding: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
            
            <p className="text-center mt-3 mb-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
              Your location is stored as an approximate geohash, not exact coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
