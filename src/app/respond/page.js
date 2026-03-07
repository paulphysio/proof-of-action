'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState, useEffect } from 'react';
import { getNearbyRequests, createResponse, getOrCreateUser, supabase } from '@/lib/supabase';
import { generateGeohash } from '@/lib/ai-verification';
import { notifyNearbyEmergency, savePushSubscription, subscribeToPushNotifications, notifyTrackingStarted } from '@/lib/notifications';
import Link from 'next/link';
import { MovementTracker, storeTrackingData, notifyNeighbors } from '@/lib/movement-tracking';
import { storeResponseCommitmentOnFilecoin } from '@/lib/filecoin';
import { getWorldIDVerification } from '@/lib/worldid';
import RequesterStaticMap from '@/components/maps/RequesterStaticMap';

// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Simple geohash decoder (approximate location)
function geohashToLatLon(geohash) {
  // This is a simplified decoder - in production use a proper geohash library
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let lat = -90, lon = -180;
  let latRange = 180, lonRange = 360;
  
  for (let i = 0; i < geohash.length; i++) {
    const char = geohash[i];
    const index = base32.indexOf(char);
    
    for (let j = 4; j >= 0; j--) {
      const bit = (index >> j) & 1;
      
      if (j % 2 === 1) {
        lonRange /= 2;
        lon += bit * lonRange;
      } else {
        latRange /= 2;
        lat += bit * latRange;
      }
    }
  }
  
  return { lat: lat + latRange/2, lon: lon + lonRange/2 };
}
import { 
  Wallet,
  HandHelping,
  MapPin,
  Clock,
  RefreshCw,
  Loader2,
  Check,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  User,
  Award,
  Plus,
  Sparkles,
  Navigation,
  Radio,
  Navigation2,
  Shield
} from 'lucide-react';

function buildNearbyGeohashPrefixes(lat, lon, prefixLength) {
  const delta = 0.2;
  const points = [
    [lat, lon],
    [lat + delta, lon],
    [lat - delta, lon],
    [lat, lon + delta],
    [lat, lon - delta],
    [lat + delta, lon + delta],
    [lat + delta, lon - delta],
    [lat - delta, lon + delta],
    [lat - delta, lon - delta]
  ];

  const prefixes = new Set();
  for (const [pLat, pLon] of points) {
    const gh = generateGeohash(pLat, pLon, 6);
    prefixes.add(gh.slice(0, prefixLength));
  }

  return Array.from(prefixes);
}

export default function RespondPage() {
  const { isSignedIn, accountId, signIn } = useWallet();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('idle'); // idle, active, completed
  const [movementAnalysis, setMovementAnalysis] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyPrefixes, setNearbyPrefixes] = useState(null);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const GEOFENCE_PREFIX_LENGTH = 3;

  useEffect(() => {
    if (isSignedIn) {
      loadNearbyRequests();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !Array.isArray(nearbyPrefixes) || nearbyPrefixes.length === 0) return;
    if (!supabase?.channel) return;

    const channel = supabase
      .channel('nearby-emergency-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_requests' },
        (payload) => {
          const newRequest = payload?.new;
          if (!newRequest) return;
          if (newRequest.status !== 'open') return;
          if (newRequest.requester_wallet === accountId) return;
          if (typeof newRequest.geohash !== 'string') return;
          const matches = nearbyPrefixes.some((p) => newRequest.geohash.startsWith(p));
          if (!matches) return;

          setRequests((prev) => {
            if (prev.some((r) => r.id === newRequest.id)) return prev;
            return [newRequest, ...prev];
          });

          notifyNearbyEmergency(newRequest);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSignedIn, nearbyPrefixes, accountId]);

  useEffect(() => {
    if (!isSignedIn || !accountId) return;
    if (!Array.isArray(nearbyPrefixes) || nearbyPrefixes.length === 0) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    let cancelled = false;
    (async () => {
      const sub = await subscribeToPushNotifications();
      if (cancelled) return;
      if (sub) {
        await savePushSubscription(sub, accountId, nearbyPrefixes);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, accountId, nearbyPrefixes]);

  const loadNearbyRequests = async () => {
    setLoading(true);
    try {
      // Try to get location silently first, but don't block if not available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setUserLocation({ lat, lon });
            const prefixes = buildNearbyGeohashPrefixes(lat, lon, GEOFENCE_PREFIX_LENGTH);
            setNearbyPrefixes(prefixes);
            const nearby = await getNearbyRequests(prefixes);
            const filtered = nearby.filter(r => r.requester_wallet !== accountId);
            setRequests(filtered);
          },
          async () => {
            // Location denied or error - still load requests with default location
            const lat = 40.7128;
            const lon = -74.0060;
            const prefixes = buildNearbyGeohashPrefixes(lat, lon, GEOFENCE_PREFIX_LENGTH);
            setNearbyPrefixes(prefixes);
            const nearby = await getNearbyRequests(prefixes);
            const filtered = nearby.filter(r => r.requester_wallet !== accountId);
            setRequests(filtered);
          },
          { timeout: 5000, maximumAge: 60000 } // Quick timeout, allow cached
        );
      } else {
        const lat = 40.7128;
        const lon = -74.0060;
        const prefixes = buildNearbyGeohashPrefixes(lat, lon, GEOFENCE_PREFIX_LENGTH);
        setNearbyPrefixes(prefixes);
        const nearby = await getNearbyRequests(prefixes);
        const filtered = nearby.filter(r => r.requester_wallet !== accountId);
        setRequests(filtered);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
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
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({ lat, lon });
          const prefixes = buildNearbyGeohashPrefixes(lat, lon, GEOFENCE_PREFIX_LENGTH);
          setNearbyPrefixes(prefixes);
          resolve({ lat, lon, prefixes });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleRespondClick = (request) => {
    // If we don't have location, show the location prompt
    if (!userLocation) {
      setPendingRequest(request);
      setShowLocationPrompt(true);
      return;
    }
    // Otherwise proceed directly
    handleRespond(request);
  };

  const confirmLocationAndRespond = async () => {
    try {
      await requestLocationPermission();
      setShowLocationPrompt(false);
      if (pendingRequest) {
        handleRespond(pendingRequest);
        setPendingRequest(null);
      }
    } catch (error) {
      alert('Location access is required to respond to requests and track your movement for verification. Please enable location permissions and try again.');
    }
  };

  /**
   * Convert geohash to approximate lat/lon
   */
  function geohashToLatLon(geohash) {
    // Simplified - just return user location as approximation
    // In production, use proper geohash decoding
    return userLocation || { lat: 40.7128, lon: -74.0060 };
  }

  const handleRespond = async (request) => {
    setResponding(request.id);
    try {
      await getOrCreateUser(accountId);
      const response = await createResponse(request.id, accountId);
      
      if (response) {
        // Store commitment to help on Filecoin
        try {
          console.log('📤 Storing response commitment on Filecoin...');
          const commitmentData = {
            requestId: request.id,
            responderWallet: accountId,
            timestamp: new Date().toISOString(),
            initialLocation: userLocation ? {
              lat: userLocation.lat,
              lon: userLocation.lng,
              geohash: generateGeohash(userLocation.lat, userLocation.lng, 6),
              accuracy: userLocation.accuracy
            } : null,
            estimatedArrival: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 mins estimate
            worldIDVerification: getWorldIDVerification(),
            emergencyType: request.emergency_type,
            urgencyLevel: request.urgency_level,
            distanceToRequest: userLocation ? calculateDistance(
              userLocation.lat, userLocation.lng,
              geohashToLatLon(request.geohash).lat,
              geohashToLatLon(request.geohash).lon
            ) : null
          };
          
          console.log('📊 Commitment data:', {
            requestId: commitmentData.requestId,
            responderWallet: commitmentData.responderWallet,
            hasLocation: !!commitmentData.initialLocation,
            hasWorldID: !!commitmentData.worldIDVerification
          });
          
          const commitmentResult = await storeResponseCommitmentOnFilecoin(commitmentData);
          console.log('✅ Response commitment stored on Filecoin:', commitmentResult);
          
          if (commitmentResult.success) {
            console.log(`🎉 Commitment CID: ${commitmentResult.pieceCid}`);
          } else {
            console.warn('⚠️ Commitment storage failed:', commitmentResult.error);
          }
        } catch (filecoinError) {
          console.warn('❌ Filecoin commitment storage failed (non-critical):', filecoinError);
          console.warn('Error details:', {
            message: filecoinError.message,
            stack: filecoinError.stack
          });
        }
        
        setSuccess(request);
        setTracking(response);
        setTrackingStatus('active');
        
        // Start movement tracking
        if (userLocation && request.geohash) {
          // Decode approximate requester location from geohash
          const requesterLocation = geohashToLatLon(request.geohash);
          
          const newTracker = new MovementTracker(
            response.id,
            requesterLocation,
            accountId
          );
          
          setTracker(newTracker);
          await newTracker.start();
          
          // Update tracking status periodically
          const statusInterval = setInterval(() => {
            if (newTracker.locations.length > 0) {
              const analysis = newTracker.analyzeMovement();
              setMovementAnalysis(analysis);
            }
          }, 30000);
          
          // Store interval for cleanup
          newTracker.statusInterval = statusInterval;
        }
        
        notifyTrackingStarted(request);
        if (request?.requester_wallet) {
          fetch('/api/push/notify-requester', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterWallet: request.requester_wallet, requestId: request.id })
          }).catch(() => {});
        }
        setRequests(requests.filter(r => r.id !== request.id));
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Failed to respond. Please try again.');
    } finally {
      setResponding(null);
    }
  };

  /**
   * Complete the help action and stop tracking
   */
  const completeHelp = async () => {
    if (!tracker || !tracking) return;
    
    try {
      // Stop tracking
      const stopResult = tracker.stop();
      if (tracker.statusInterval) {
        clearInterval(tracker.statusInterval);
      }
      
      // Get final analysis
      const finalAnalysis = tracker.analyzeMovement();
      setMovementAnalysis(finalAnalysis);
      
      // Store tracking data
      const trackingData = tracker.getTrackingData();
      await storeTrackingData(supabase, trackingData);
      
      // Get neighbors to notify
      const response = await supabase
        .from('responses')
        .select('*')
        .eq('request_id', tracking.id)
        .eq('responder_wallet', accountId)
        .single();
        
      if (response.data) {
        const neighbors = await notifyNeighbors(supabase, tracking, response.data, trackingData);
        
        // Send push notifications to neighbors
        if (neighbors.length > 0) {
          fetch('/api/push/notify-neighbors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              neighbors,
              requestType: tracking.request_type,
              responderWallet: accountId
            })
          }).catch(() => {});
        }
      }
      
      // Update status
      await supabase
        .from('responses')
        .update({ status: 'completed' })
        .eq('request_id', tracking.id)
        .eq('responder_wallet', accountId);
        
      setTrackingStatus('completed');
      
    } catch (error) {
      console.error('Error completing help:', error);
    }
  };

  /**
   * Convert geohash to approximate lat/lon
   */
  function geohashToLatLon(geohash) {
    // Simplified - just return user location as approximation
    // In production, use proper geohash decoding
    return userLocation || { lat: 40.7128, lon: -74.0060 };
  }

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
                  Create or import your Solana wallet to help others in your community.
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

  if (success && trackingStatus !== 'completed') {
    return (
      <div className="min-vh-100" style={{ background: 'var(--navy-950)', position: 'relative', overflow: 'hidden' }}>
        <div className="aurora-bg" />
        <div className="container py-4 py-md-5 px-3 px-md-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="glass-card overflow-hidden" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                {/* Header */}
                <div 
                  className="p-3 p-md-4"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))',
                    borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="animate-pulse-glow"
                        style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '14px',
                          background: trackingStatus === 'active' 
                            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))'
                            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                          border: `2px solid ${trackingStatus === 'active' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {trackingStatus === 'active' ? (
                          <Radio size={28} color="#06B6D4" className="animate-pulse" />
                        ) : (
                          <Check size={28} color="#10B981" />
                        )}
                      </div>
                      <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.25rem' }}>
                          {trackingStatus === 'active' ? 'Help in Progress' : 'Tracking Complete'}
                        </h4>
                        <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                          You're helping with <strong style={{ color: 'var(--cyan-400)' }}>{success.request_type}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 p-md-4">
                  <div className="row g-4">
                    {/* Left Column - Map */}
                    <div className="col-md-6">
                      <RequesterStaticMap 
                        requesterLocation={success.geohash ? geohashToLatLon(success.geohash) : { lat: 40.7128, lon: -74.0060 }}
                        requesterGeohash={success.geohash}
                        requestType={success.request_type}
                        requestTime={success.created_at}
                        responderLocation={userLocation ? {
                          lat: parseFloat(userLocation.lat),
                          lon: parseFloat(userLocation.lon)
                        } : null}
                      />
                    </div>

                    {/* Right Column - Tracking Status */}
                    <div className="col-md-6">
                      <div className="glass-card h-100" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                        <div className="p-3 p-md-4">
                          <div className="d-flex align-items-center gap-2 mb-4">
                            <Navigation2 size={18} color="#06B6D4" />
                            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>Movement Tracking</span>
                          </div>
                          
                          {movementAnalysis ? (
                            <div>
                              {/* Confidence Score */}
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>Movement Confidence</span>
                                  <span style={{ 
                                    color: movementAnalysis.confidence > 0.7 ? '#10B981' : movementAnalysis.confidence > 0.5 ? '#F59E0B' : '#F43F5E',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                  }}>
                                    {Math.round(movementAnalysis.confidence * 100)}%
                                  </span>
                                </div>
                                <div style={{ 
                                  height: '8px', 
                                  background: 'rgba(255,255,255,0.1)', 
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div 
                                    style={{ 
                                      height: '100%', 
                                      width: `${movementAnalysis.confidence * 100}%`,
                                      background: movementAnalysis.confidence > 0.7 ? '#10B981' : movementAnalysis.confidence > 0.5 ? '#F59E0B' : '#F43F5E',
                                      borderRadius: '4px',
                                      transition: 'width 0.5s ease'
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="row g-2 mb-3">
                                <div className="col-6">
                                  <div className="p-2 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                    <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distance</small>
                                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                                      {movementAnalysis.endDistance?.toFixed(2)} km
                                    </span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="p-2 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                    <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Speed</small>
                                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                                      {movementAnalysis.avgSpeed?.toFixed(1)} km/h
                                    </span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="p-2 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                    <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Updates</small>
                                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                                      {tracker?.locations?.length || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="p-2 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                    <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pattern</small>
                                    <span style={{ 
                                      color: movementAnalysis.movedCloser ? '#10B981' : '#F59E0B', 
                                      fontWeight: 600, 
                                      fontSize: '0.75rem',
                                      textTransform: 'capitalize'
                                    }}>
                                      {movementAnalysis.movementPattern?.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {movementAnalysis.movedCloser && (
                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                  <Check size={16} color="#10B981" />
                                  <span style={{ color: '#10B981', fontSize: '0.8125rem', fontWeight: 500 }}>Moving toward requester</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Loader2 size={32} color="#06B6D4" className="animate-spin mb-3" />
                              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', margin: 0 }}>
                                Analyzing your movement pattern...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="mt-4 p-3 rounded" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <div className="d-flex align-items-start gap-2">
                      <Shield size={16} color="#06B6D4" className="flex-shrink-0 mt-0.5" />
                      <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        Your location is tracked only during this help session. We store only approximate geohash locations, not exact GPS coordinates. Data is deleted after verification.
                      </small>
                    </div>
                  </div>

                  {/* Complete Button */}
                  <button 
                    onClick={completeHelp}
                    className="btn btn-gradient w-100 mt-4 d-flex align-items-center justify-content-center gap-2"
                    style={{ padding: '1rem' }}
                  >
                    <Check size={20} />
                    <span>Mark Help as Complete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success && trackingStatus === 'completed') {
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
                  <HandHelping size={48} color="#10B981" />
                </div>
                <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>Help Completed!</h2>
                <p style={{ color: 'var(--slate-400)', marginBottom: '0.5rem' }}>
                  You've successfully helped with <strong style={{ color: 'var(--cyan-400)' }}>{success.request_type}</strong>.
                </p>
                <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                  Neighbors in your area have been notified of your good deed. Your Proof Points will be awarded after verification.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <Link href="/dashboard" className="btn btn-gradient">
                    View Dashboard
                  </Link>
                  <button 
                    onClick={() => { setSuccess(null); setTracking(null); setTrackingStatus('idle'); setMovementAnalysis(null); loadNearbyRequests(); }}
                    className="btn btn-outline-glass"
                  >
                    Help Someone Else
                  </button>
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
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          top: '15%',
          left: '-80px',
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
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HandHelping size={20} color="#10B981" />
              </div>
              <h2 className="m-0" style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>Requests Nearby</h2>
            </div>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              Help your community. Earn on-chain rewards.
            </p>
          </div>
          <button 
            onClick={loadNearbyRequests}
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
            <p className="mt-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>Finding nearby requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-card p-4 p-md-5 text-center animate-reveal-scale">
            <div 
              className="animate-float mx-auto"
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <Sparkles size={36} color="#F59E0B" />
            </div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem', fontSize: '1.125rem' }}>No Requests Nearby</h4>
            <p className="mb-4" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              Great news! There are no open emergency requests in your area right now.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button 
                onClick={loadNearbyRequests}
                className="btn btn-gradient"
              >
                <RefreshCw size={16} className="me-2" />
                Check Again
              </button>
              <Link href="/request" className="btn btn-gold">
                <Plus size={16} className="me-2" />
                Post Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-grid stagger-children">
            {requests.map((request, index) => (
              <div 
                key={request.id} 
                className="animate-reveal-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="glass-card h-100" style={{ borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                  <div 
                    className="p-3 d-flex justify-content-between align-items-center"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.05))',
                      borderBottom: '1px solid rgba(244, 63, 94, 0.2)'
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }} className="d-flex align-items-center gap-2">
                      <AlertCircle size={16} color="#F43F5E" />
                      {request.request_type}
                    </span>
                    <span style={{ 
                      background: 'rgba(15, 23, 42, 0.5)',
                      color: 'var(--slate-300)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem'
                    }}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 p-md-4">
                    <p style={{ color: 'var(--slate-300)', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {request.description || 'No additional details provided.'}
                    </p>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <MapPin size={12} color="var(--slate-500)" />
                      <small style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                        Location: {request.geohash.slice(0, 4)}...
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <User size={12} color="var(--slate-500)" />
                      <small style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                        Requester: {request.requester_wallet.slice(0, 10)}...
                      </small>
                    </div>
                  </div>
                  <div className="p-3 p-md-4 pt-0">
                    <button
                      onClick={() => handleRespondClick(request)}
                      disabled={responding === request.id}
                      className="btn btn-gradient w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      {responding === request.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Responding...</span>
                        </>
                      ) : (
                        <>
                          <HandHelping size={16} />
                          <span>I Can Help</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card - Mobile Optimized */}
        <div 
          className="glass-card mt-4 mt-md-5 animate-reveal-up"
          style={{ background: 'rgba(6, 182, 212, 0.05)', animationDelay: '200ms' }}
        >
          <div className="p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Award size={18} color="var(--cyan-400)" />
              <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>How Helping Works</h5>
            </div>
            <div className="row g-3 g-md-4 mt-1">
              {[
                { num: '1', title: 'Click "I Can Help"', desc: 'Movement tracking starts automatically', icon: Radio },
                { num: '2', title: 'Go Help Your Neighbor', desc: 'We track your journey to verify', icon: Navigation2 },
                { num: '3', title: 'Mark Complete', desc: 'Neighbors get notified of your good deed!', icon: Award }
              ].map((step, i) => (
                <div key={i} className="col-12 col-md-4">
                  <div className="d-flex gap-3 animate-reveal-left" style={{ animationDelay: `${i * 100}ms` }}>
                    <div 
                      className="animate-pulse-glow flex-shrink-0"
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        background: i === 2 ? 'var(--gradient-gold)' : 'var(--gradient-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: i === 2 ? 'var(--navy-950)' : 'white'
                      }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <p className="mb-1" style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>{step.title}</p>
                      <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>{step.desc}</small>
                    </div>
                  </div>
                </div>
              ))}
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
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}
              >
                <MapPin size={32} color="#06B6D4" />
              </div>
              <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.75rem' }}>
                Location Required
              </h4>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                To respond to requests and verify your movement during help sessions, we need access to your location. This helps prevent fraud and ensures safe community interactions.
              </p>
            </div>
            
            <div className="d-flex flex-column gap-3">
              <button 
                onClick={confirmLocationAndRespond}
                className="btn btn-gradient w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ padding: '0.875rem' }}
              >
                <Navigation size={18} />
                Enable Location & Continue
              </button>
              <button 
                onClick={() => {
                  setShowLocationPrompt(false);
                  setPendingRequest(null);
                }}
                className="btn btn-outline-glass w-100"
                style={{ padding: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
            
            <p className="text-center mt-3 mb-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
              Your location is only tracked during active help sessions and is never stored with personal identifiers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
