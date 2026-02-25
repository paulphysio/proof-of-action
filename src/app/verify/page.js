'use client';

import { useWallet } from '@/lib/near-wallet';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { quickVerify, verifyAction } from '@/lib/ai-verification';
import { notifyRewardReceived } from '@/lib/notifications';
import Link from 'next/link';

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
      // Get responses that are pending verification
      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          *,
          request:emergency_requests(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter responses that don't have verifications yet
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
      // Get requester profile
      const { data: requester } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', response.request.requester_wallet)
        .single();

      // Get responder profile
      const { data: responder } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', response.responder_wallet)
        .single();

      // Run AI verification
      const result = await verifyAction(
        response.request,
        response,
        requester,
        responder,
        { mutualConfirmation: true }
      );

      // Store verification in database
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

      // Update response status
      await supabase
        .from('responses')
        .update({ status: result.verified ? 'confirmed' : 'rejected' })
        .eq('id', response.id);

      // Update request status
      await supabase
        .from('emergency_requests')
        .update({ status: result.verified ? 'resolved' : 'open' })
        .eq('id', response.request_id);

      // If verified, create reward
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

        // Update responder reputation
        await supabase
          .from('users')
          .update({ reputation: (responder?.reputation || 0) + 5 })
          .eq('wallet_address', response.responder_wallet);

        notifyRewardReceived(reward);
      }

      setVerificationResult({ response, result });
      
      // Refresh list
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
      <div className="min-vh-100 bg-light d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body p-5">
                  <div className="display-1 mb-4">🔌</div>
                  <h2 className="mb-3">Connect Your Wallet</h2>
                  <p className="text-muted mb-4">
                    Create or import your Solana wallet to verify community actions.
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

  if (verificationResult) {
    const { response, result } = verificationResult;
    return (
      <div className="min-vh-100 bg-light">
        <nav className="navbar navbar-expand-lg navbar-dark bg-info">
          <div className="container">
            <Link href="/" className="navbar-brand fw-bold">
              🛡️ Proof-of-Action
            </Link>
            <Link href="/dashboard" className="btn btn-light btn-sm">
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className={`card shadow border-${result.verified ? 'success' : 'warning'}`}>
                <div className={`card-header ${result.verified ? 'bg-success' : 'bg-warning'} text-white`}>
                  <h4 className="mb-0">
                    {result.verified ? '✅ Verified!' : '⚠️ Manual Review Needed'}
                  </h4>
                </div>
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div className="display-1">{result.verified ? '🎉' : '🤔'}</div>
                    <h3 className={result.verified ? 'text-success' : 'text-warning'}>
                      Confidence Score: {(result.confidenceScore * 100).toFixed(1)}%
                    </h3>
                  </div>

                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Verification Breakdown</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="d-flex justify-content-between">
                            <span>Time Proximity</span>
                            <span className="fw-bold">
                              {(result.breakdown.timeScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-primary" 
                              style={{ width: `${result.breakdown.timeScore * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex justify-content-between">
                            <span>Location Proximity</span>
                            <span className="fw-bold">
                              {(result.breakdown.locationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ width: `${result.breakdown.locationScore * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex justify-content-between">
                            <span>Mutual Confirmation</span>
                            <span className="fw-bold">
                              {(result.breakdown.confirmationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-info" 
                              style={{ width: `${result.breakdown.confirmationScore * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex justify-content-between">
                            <span>Reputation</span>
                            <span className="fw-bold">
                              {(result.breakdown.reputationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-warning" 
                              style={{ width: `${result.breakdown.reputationScore * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.flags.length > 0 && (
                    <div className="alert alert-warning">
                      <h6>⚠️ Flags Detected:</h6>
                      <ul className="mb-0">
                        {result.flags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.verified && (
                    <div className="alert alert-success">
                      <h6>🎁 Rewards Issued:</h6>
                      <p className="mb-0">
                        <strong>10 Proof Points</strong> and <strong>+5 Reputation</strong> 
                        {' '}awarded to {response.responder_wallet.slice(0, 16)}...
                      </p>
                    </div>
                  )}

                  <div className="d-flex gap-3 justify-content-center">
                    <button 
                      onClick={() => setVerificationResult(null)}
                      className="btn btn-primary"
                    >
                      Verify Another
                    </button>
                    <Link href="/dashboard" className="btn btn-outline-secondary">
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
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-info">
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
            <h2 className="mb-1">🤖 AI Verification Engine</h2>
            <p className="text-muted mb-0">
              Verify community actions and prevent fraud. Earn reputation as a verifier.
            </p>
          </div>
          <button 
            onClick={loadPendingVerifications}
            className="btn btn-outline-info"
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
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Finding pending verifications...</p>
          </div>
        ) : pendingVerifications.length === 0 ? (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <div className="display-1 mb-4">✨</div>
              <h4>No Pending Verifications</h4>
              <p className="text-muted mb-4">
                All community actions have been processed. Check back later!
              </p>
              <Link href="/dashboard" className="btn btn-info text-white">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {pendingVerifications.map((response) => (
              <div key={response.id} className="col-md-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-info text-white d-flex justify-content-between">
                    <span>Pending Verification</span>
                    <span className="badge bg-light text-dark">
                      {new Date(response.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{response.request?.request_type}</h5>
                    <p className="card-text">
                      {response.request?.description || 'No description'}
                    </p>
                    <hr />
                    <div className="mb-2">
                      <small className="text-muted d-block">
                        <strong>Requester:</strong> {response.request?.requester_wallet.slice(0, 16)}...
                      </small>
                      <small className="text-muted d-block">
                        <strong>Responder:</strong> {response.responder_wallet.slice(0, 16)}...
                      </small>
                      <small className="text-muted d-block">
                        <strong>Location:</strong> {response.request?.geohash.slice(0, 4)}...
                      </small>
                    </div>
                  </div>
                  <div className="card-footer bg-white">
                    <button
                      onClick={() => handleVerify(response)}
                      disabled={verifying === response.id}
                      className="btn btn-info w-100 text-white"
                    >
                      {verifying === response.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Verifying...
                        </>
                      ) : (
                        '🤖 Run AI Verification'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Info Card */}
        <div className="card mt-4 border-info">
          <div className="card-header bg-info-subtle">
            <h5 className="mb-0">🧠 How AI Verification Works</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Verification Factors:</h6>
                <ul className="list-unstyled small">
                  <li className="mb-2">
                    <strong>Time Proximity (25%):</strong> Response time after request
                  </li>
                  <li className="mb-2">
                    <strong>Location Proximity (30%):</strong> Geohash matching for privacy
                  </li>
                  <li className="mb-2">
                    <strong>Mutual Confirmation (25%):</strong> Both parties confirm completion
                  </li>
                  <li className="mb-2">
                    <strong>Reputation Score (10%):</strong> Historical trustworthiness
                  </li>
                  <li className="mb-2">
                    <strong>Pattern Analysis (10%):</strong> Fraud detection
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Anti-Fraud Checks:</h6>
                <ul className="list-unstyled small">
                  <li className="mb-2">✓ Self-response detection</li>
                  <li className="mb-2">✓ Suspicious speed analysis</li>
                  <li className="mb-2">✓ Circular transaction detection</li>
                  <li className="mb-2">✓ Volume anomaly detection</li>
                  <li className="mb-2">✓ Geolocation consistency</li>
                </ul>
              </div>
            </div>
            <div className="alert alert-info mt-3 mb-0">
              <small>
                <strong>Modular Design:</strong> The AI engine is built to be replaced 
                with ML models. Current implementation uses rule-based verification 
                with hooks for future TensorFlow/PyTorch integration.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
