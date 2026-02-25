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
      // Get or create user
      const userData = await getOrCreateUser(accountId);
      setUser(userData);

      // Load all user data in parallel
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
      <div className="min-vh-100 bg-light d-flex align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body p-5">
                  <div className="display-1 mb-4">🔌</div>
                  <h2 className="mb-3">Connect Your Wallet</h2>
                  <p className="text-muted mb-4">
                    Create or import your Solana wallet to view your dashboard, reputation, and rewards.
                  </p>
                  <button onClick={signIn} className="btn btn-primary btn-lg">
                    Import Wallet
                  </button>
                  <div className="mt-3">
                    <Link href="/" className="btn btn-link">
                      ← Back to Home
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

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold">
            🛡️ Proof-of-Action
          </Link>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light small d-none d-sm-inline">
              {accountId?.slice(0, 16)}...
            </span>
            <Link href="/" className="btn btn-light btn-sm">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <div className="display-5 fw-bold">{reputation}</div>
                <small>Reputation Score</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <div className="display-5 fw-bold">{totalRewards}</div>
                <small>Proof Points</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <div className="display-5 fw-bold">{requests.length}</div>
                <small>My Requests</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body text-center">
                <div className="display-5 fw-bold">{responses.length}</div>
                <small>Help Provided</small>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex gap-3 flex-wrap">
              <Link href="/request" className="btn btn-danger btn-lg">
                🚨 New Emergency Request
              </Link>
              <Link href="/respond" className="btn btn-success btn-lg">
                🤝 Help Someone Nearby
              </Link>
              <Link href="/verify" className="btn btn-info btn-lg text-white">
                🤖 Verify Actions
              </Link>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Recent Requests */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">📋 My Emergency Requests</h5>
              </div>
              <div className="card-body p-0">
                {requests.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <p>No requests yet.</p>
                    <Link href="/request" className="btn btn-outline-primary btn-sm">
                      Create your first request
                    </Link>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{request.request_type}</h6>
                            <p className="mb-1 small text-muted">
                              {request.description?.slice(0, 60)}...
                            </p>
                            <small className="text-muted">
                              {new Date(request.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <span className={`badge bg-${
                            request.status === 'open' ? 'danger' :
                            request.status === 'in_progress' ? 'warning' :
                            request.status === 'resolved' ? 'success' : 'secondary'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Responses */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">🤝 My Help Actions</h5>
              </div>
              <div className="card-body p-0">
                {responses.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <p>No help actions yet.</p>
                    <Link href="/respond" className="btn btn-outline-success btn-sm">
                      Find someone to help
                    </Link>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {responses.slice(0, 5).map((response) => (
                      <div key={response.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">
                              Helped with: {response.request?.request_type}
                            </h6>
                            <p className="mb-1 small text-muted">
                              Status: {response.status}
                            </p>
                            <small className="text-muted">
                              {new Date(response.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <span className={`badge bg-${
                            response.status === 'completed' ? 'success' :
                            response.status === 'confirmed' ? 'info' :
                            response.status === 'pending' ? 'warning' : 'secondary'
                          }`}>
                            {response.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Rewards */}
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">🎁 Recent Rewards</h5>
              </div>
              <div className="card-body">
                {rewards.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>No rewards yet. Complete verified actions to earn!</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewards.slice(0, 10).map((reward) => (
                          <tr key={reward.id}>
                            <td>
                              <span className="badge bg-success">+{reward.amount}</span>
                            </td>
                            <td>{reward.reason}</td>
                            <td className="text-muted small">
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
