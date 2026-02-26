'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState } from 'react';
import { createEmergencyRequest, getOrCreateUser } from '@/lib/supabase';
import { generateGeohash } from '@/lib/ai-verification';
import { notifyNearbyEmergency } from '@/lib/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const REQUEST_TYPES = [
  { value: 'medication', label: '💊 Medication', desc: 'Insulin, inhalers, epipens, etc.' },
  { value: 'medical_supplies', label: '🏥 Medical Supplies', desc: 'Bandages, first aid, etc.' },
  { value: 'food', label: '🍎 Food/Water', desc: 'Emergency food supplies' },
  { value: 'shelter', label: '🏠 Temporary Shelter', desc: 'Emergency accommodation' },
  { value: 'transport', label: '🚗 Emergency Transport', desc: 'Ride to medical facility' },
  { value: 'other', label: '🆘 Other Emergency', desc: 'Other urgent needs' }
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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        (err) => {
          setError('Could not get location: ' + err.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure user exists
      await getOrCreateUser(accountId);

      // Generate geohash from coordinates (or use default)
      const lat = parseFloat(latitude) || 40.7128;
      const lon = parseFloat(longitude) || -74.0060;
      const geohash = generateGeohash(lat, lon, 6);

      // Create request
      const request = await createEmergencyRequest(
        accountId,
        REQUEST_TYPES.find(t => t.value === requestType)?.label || requestType,
        description,
        geohash
      );

      if (request) {
        setSuccess(true);
        
        // Send notification (demo purposes)
        notifyNearbyEmergency(request);

        // Background device alerts (Web Push): notify nearby helpers
        const prefix = typeof request.geohash === 'string' ? request.geohash.slice(0, 3) : null;
        if (prefix) {
          fetch('/api/push/notify-nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request, geohashPrefixes: [prefix] })
          }).catch(() => {});
        }

        // Redirect to dashboard after 2 seconds
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
      <div className="min-vh-100 bg-light d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body p-5">
                  <div className="display-1 mb-4">🔌</div>
                  <h2 className="mb-3">Connect Your Wallet</h2>
                  <p className="text-muted mb-4">
                    Create or import your Solana wallet to post emergency requests.
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
                  <div className="display-1 mb-4">✅</div>
                  <h2 className="text-success mb-3">Request Posted!</h2>
                  <p className="text-muted mb-4">
                    Your emergency request has been posted. Nearby users will be notified.
                  </p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Link href="/dashboard" className="btn btn-primary">
                      Go to Dashboard
                    </Link>
                    <Link href="/" className="btn btn-outline-secondary">
                      Back to Home
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
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger">
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

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-danger text-white">
                <h4 className="mb-0">🚨 Post Emergency Request</h4>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-bold">What do you need?</label>
                    <div className="row g-2">
                      {REQUEST_TYPES.map((type) => (
                        <div key={type.value} className="col-md-6">
                          <div 
                            className={`card cursor-pointer ${requestType === type.value ? 'border-primary bg-primary-subtle' : 'border'}`}
                            onClick={() => setRequestType(type.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body py-3">
                              <div className="d-flex align-items-center">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="requestType"
                                    checked={requestType === type.value}
                                    onChange={() => setRequestType(type.value)}
                                  />
                                </div>
                                <div className="ms-2">
                                  <div className="fw-bold">{type.label}</div>
                                  <small className="text-muted">{type.desc}</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="form-label fw-bold">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      id="description"
                      className="form-control"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., 'Need insulin within 2 hours, can meet at pharmacy'"
                    />
                    <div className="form-text">
                      ⚠️ Never share personal medical details. Keep it brief and safe.
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Your Location</label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Latitude"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Longitude"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleGetLocation}
                      >
                        📍 Get My Location
                      </button>
                      <span className="ms-2 text-muted small">
                        Your exact location is hashed for privacy
                      </span>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <small>
                      <strong>🔒 Privacy Note:</strong> Your location is stored as a geohash 
                      (approximate area), not exact coordinates. Your wallet address is your 
                      only identifier.
                    </small>
                  </div>

                  <div className="d-flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-danger btn-lg"
                      disabled={loading || !requestType}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Posting...
                        </>
                      ) : (
                        '🚨 Post Emergency Request'
                      )}
                    </button>
                    <Link href="/dashboard" className="btn btn-outline-secondary btn-lg">
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
