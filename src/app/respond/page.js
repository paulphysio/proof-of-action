'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState, useEffect } from 'react';
import { getNearbyRequests, createResponse, getOrCreateUser } from '@/lib/supabase';
import { generateGeohash } from '@/lib/ai-verification';
import { notifyActionConfirmed } from '@/lib/notifications';
import Link from 'next/link';

export default function RespondPage() {
  const { isSignedIn, accountId, signIn } = useWallet();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      loadNearbyRequests();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const loadNearbyRequests = async () => {
    setLoading(true);
    try {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setUserLocation({ lat, lon });
            
            // Generate geohash and get nearby requests
            const geohash = generateGeohash(lat, lon, 6);
            const nearby = await getNearbyRequests(geohash);
            
            // Filter out user's own requests
            const filtered = nearby.filter(r => r.requester_wallet !== accountId);
            setRequests(filtered);
          },
          async () => {
            // Fallback: use default geohash
            const geohash = generateGeohash(40.7128, -74.0060, 4);
            const nearby = await getNearbyRequests(geohash);
            const filtered = nearby.filter(r => r.requester_wallet !== accountId);
            setRequests(filtered);
          }
        );
      } else {
        const geohash = generateGeohash(40.7128, -74.0060, 4);
        const nearby = await getNearbyRequests(geohash);
        const filtered = nearby.filter(r => r.requester_wallet !== accountId);
        setRequests(filtered);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (request) => {
    setResponding(request.id);
    try {
      await getOrCreateUser(accountId);
      const response = await createResponse(request.id, accountId);
      
      if (response) {
        setSuccess(request);
        notifyActionConfirmed(response);
        
        // Refresh list
        setRequests(requests.filter(r => r.id !== request.id));
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Failed to respond. Please try again.');
    } finally {
      setResponding(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body p-5">
                  <div className="display-1 mb-4">🔌</div>
                  <h2 className="mb-3">Connect Your Wallet</h2>
                  <p className="text-muted mb-4">
                    Create or import your Solana wallet to help others in your community.
                  </p>
                  <button onClick={signIn} className="btn btn-primary btn-lg">
                    Import Wallet
                  </button>
                  <div className="mt-3">
                    <Link href="/" className="btn btn-link">← Back to Home</Link>
                  </div>
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
      <div className="min-vh-100 bg-light d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="card shadow border-success">
                <div className="card-body p-5">
                  <div className="display-1 mb-4">🤝</div>
                  <h2 className="text-success mb-3">Response Sent!</h2>
                  <p className="text-muted mb-4">
                    You've offered to help with <strong>{success.request_type}</strong>.
                    The requester will be notified. Once confirmed, you'll earn rewards!
                  </p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Link href="/dashboard" className="btn btn-primary">
                      View Dashboard
                    </Link>
                    <button 
                      onClick={() => { setSuccess(null); loadNearbyRequests(); }}
                      className="btn btn-outline-success"
                    >
                      Help Someone Else
                    </button>
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
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold">
            🛡️ Proof-of-Action
          </Link>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light small d-none d-sm-inline">
              {accountId?.slice(0, 16)}...
            </span>
            <Link href="/dashboard" className="btn btn-light btn-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">🤝 Emergency Requests Nearby</h2>
            <p className="text-muted mb-0">
              Help your community. Earn on-chain rewards.
            </p>
          </div>
          <button 
            onClick={loadNearbyRequests}
            className="btn btn-outline-success"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Finding nearby requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <div className="display-1 mb-4">🌟</div>
              <h4>No Emergency Requests Nearby</h4>
              <p className="text-muted mb-4">
                Great news! There are no open emergency requests in your area right now.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <button 
                  onClick={loadNearbyRequests}
                  className="btn btn-success"
                >
                  Check Again
                </button>
                <Link href="/request" className="btn btn-outline-danger">
                  Post a Request
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {requests.map((request) => (
              <div key={request.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-warning">
                  <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                    <span className="fw-bold">🚨 {request.request_type}</span>
                    <span className="badge bg-light text-dark">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="card-text">
                      {request.description || 'No additional details provided.'}
                    </p>
                    <div className="mt-3">
                      <small className="text-muted">
                        📍 Location: {request.geohash.slice(0, 4)}...
                      </small>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">
                        👤 Requester: {request.requester_wallet.slice(0, 12)}...
                      </small>
                    </div>
                  </div>
                  <div className="card-footer bg-white">
                    <button
                      onClick={() => handleRespond(request)}
                      disabled={responding === request.id}
                      className="btn btn-success w-100"
                    >
                      {responding === request.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Responding...
                        </>
                      ) : (
                        '🤝 I Can Help'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="card mt-4 bg-primary text-white">
          <div className="card-body">
            <h5 className="card-title">💡 How Helping Works</h5>
            <div className="row mt-3">
              <div className="col-md-4">
                <p className="mb-1"><strong>1. Click "I Can Help"</strong></p>
                <small>Respond to an emergency request near you</small>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>2. Meet & Help</strong></p>
                <small>Coordinate with the requester and provide assistance</small>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>3. Get Verified</strong></p>
                <small>AI verifies the action and you earn rewards!</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
