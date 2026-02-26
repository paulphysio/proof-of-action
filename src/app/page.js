'use client';

import { useWallet } from '@/lib/near-wallet';
import { requestNotificationPermission, savePushSubscription, subscribeToPushNotifications } from '@/lib/notifications';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function Home() {
  const { isSignedIn, signOut, createWallet, importWallet, accountId } = useWallet();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [createdMnemonic, setCreatedMnemonic] = useState('');
  const [confirmedBackup, setConfirmedBackup] = useState(false);
  const [importPhrase, setImportPhrase] = useState('');
  const [walletError, setWalletError] = useState('');

  const shortAddress = useMemo(() => {
    if (!accountId) return '';
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  }, [accountId]);

  const handleCreateWallet = async () => {
    setWalletError('');
    setConfirmedBackup(false);
    try {
      const { mnemonic } = await createWallet();
      setCreatedMnemonic(mnemonic);
      setShowOnboarding(true);
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
      setCreatedMnemonic('');
      setImportPhrase('');
    } catch (e) {
      console.error(e);
      setWalletError('Invalid recovery phrase. Please double-check the words and spacing.');
    }
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
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold">
            🛡️ Proof-of-Action
          </Link>
          <div className="d-flex align-items-center gap-3">
            {isSignedIn ? (
              <>
                <span className="text-light small">{shortAddress}</span>
                <Link href="/dashboard" className="btn btn-light btn-sm">
                  Dashboard
                </Link>
                <button onClick={signOut} className="btn btn-outline-light btn-sm">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowOnboarding((v) => !v)} className="btn btn-outline-light btn-sm">
                  Wallet
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">
                Help Your Community.<br />
                <span className="text-warning">Earn On-Chain Rewards.</span>
              </h1>
              <p className="lead mb-4">
                A privacy-first emergency network where real-world helpful actions 
                are verified by AI and rewarded with blockchain tokens.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {isSignedIn ? (
                  <>
                    <Link href="/request" className="btn btn-warning btn-lg fw-bold">
                      🚨 Request Help
                    </Link>
                    <Link href="/respond" className="btn btn-outline-light btn-lg">
                      🤝 Offer Help
                    </Link>
                  </>
                ) : (
                  <button onClick={() => setShowOnboarding(true)} className="btn btn-warning btn-lg fw-bold">
                    🔐 Create or Import Wallet
                  </button>
                )}
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <div className="display-1">🆘→✅→🎁</div>
            </div>
          </div>
        </div>
      </div>

      {!isSignedIn && showOnboarding && (
        <div className="bg-white border-bottom">
          <div className="container py-4">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="card shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Solana Wallet (Embedded)</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowOnboarding(false)}>
                      Close
                    </button>
                  </div>
                  <div className="card-body">
                    {walletError && (
                      <div className="alert alert-danger" role="alert">
                        {walletError}
                      </div>
                    )}

                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-2">Create a new wallet</h6>
                        <p className="text-muted small mb-3">
                          This generates a recovery phrase on your device. Save it somewhere safe.
                          Anyone with the phrase can access your wallet.
                        </p>
                        <button className="btn btn-primary" onClick={handleCreateWallet}>
                          Generate Recovery Phrase
                        </button>

                        {createdMnemonic && (
                          <div className="mt-3">
                            <label className="form-label fw-bold">Your recovery phrase</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={createdMnemonic}
                              readOnly
                            />
                            <div className="form-check mt-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={confirmedBackup}
                                onChange={(e) => setConfirmedBackup(e.target.checked)}
                                id="confirmedBackup"
                              />
                              <label className="form-check-label" htmlFor="confirmedBackup">
                                I saved this phrase securely
                              </label>
                            </div>
                            <div className="mt-3 d-flex gap-2">
                              <button
                                className="btn btn-success"
                                disabled={!confirmedBackup}
                                onClick={() => setShowOnboarding(false)}
                              >
                                Continue
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  setCreatedMnemonic('');
                                  setConfirmedBackup(false);
                                }}
                              >
                                Discard & Regenerate
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <h6 className="mb-2">Import an existing wallet</h6>
                        <p className="text-muted small mb-3">
                          Paste your 12- or 24-word recovery phrase.
                        </p>
                        <textarea
                          className="form-control"
                          rows={4}
                          placeholder="word1 word2 word3 ..."
                          value={importPhrase}
                          onChange={(e) => setImportPhrase(e.target.value)}
                        />
                        <div className="mt-3">
                          <button
                            className="btn btn-outline-primary"
                            onClick={handleImportWallet}
                            disabled={!importPhrase.trim()}
                          >
                            Import Wallet
                          </button>
                        </div>
                        <div className="alert alert-warning mt-3 mb-0">
                          <small>
                            <strong>Security:</strong> This demo stores the wallet secret key in your browser storage.
                            For production, use secure enclaves/MPC/secure storage.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">How Proof-of-Action Works</h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 mb-3">🚨</div>
                  <h5 className="card-title">1. Post Emergency</h5>
                  <p className="card-text text-muted small">
                    Share urgent needs like insulin, inhalers, or first aid supplies.
                    Your location is privacy-protected.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 mb-3">🤝</div>
                  <h5 className="card-title">2. Nearby Response</h5>
                  <p className="card-text text-muted small">
                    Community members nearby receive alerts and can offer help.
                    No personal data shared.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 mb-3">🤖</div>
                  <h5 className="card-title">3. AI Verification</h5>
                  <p className="card-text text-muted small">
                    Our AI engine verifies time, location, and mutual confirmation 
                    to prevent fraud.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 mb-3">🎁</div>
                  <h5 className="card-title">4. Earn Rewards</h5>
                  <p className="card-text text-muted small">
                    Verified helpers receive Proof Points and NEAR tokens. 
                    Build reputation with each action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Tech Stack */}
      <div className="bg-white py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6">
              <h3 className="mb-3">🔒 Privacy First</h3>
              <ul className="list-unstyled">
                <li className="mb-2">✓ No real names required</li>
                <li className="mb-2">✓ Wallet = Identity</li>
                <li className="mb-2">✓ Hashed location (not exact GPS)</li>
                <li className="mb-2">✓ Medical details never stored publicly</li>
                <li className="mb-2">✓ AI verifies patterns, not personal data</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h3 className="mb-3">⚡ Powered By</h3>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-primary">Next.js</span>
                <span className="badge bg-success">Bootstrap 5</span>
                <span className="badge bg-info text-dark">Supabase</span>
                <span className="badge bg-warning text-dark">Solana</span>
                <span className="badge bg-danger">AI Verification</span>
                <span className="badge bg-secondary">PWA</span>
              </div>
              <p className="mt-3 text-muted small">
                Built for hackathons. Production-ready architecture. 
                Modular AI engine ready for ML integration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo CTA */}
      <div className="bg-dark text-white py-5">
        <div className="container text-center">
          <h2 className="mb-3">Ready to Try the Demo?</h2>
          <p className="lead mb-4">
            Experience the full flow: Connect wallet → Post request → Respond → 
            AI verification → Earn rewards.
          </p>
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard
            </Link>
          ) : (
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button onClick={() => setShowOnboarding(true)} className="btn btn-primary btn-lg">
                Start (Create/Import Wallet)
              </button>
            </div>
          )}
          <div className="mt-4">
            <button 
              onClick={handleEnableNotifications}
              className="btn btn-outline-light btn-sm"
            >
              🔔 Enable Push Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-light py-4">
        <div className="container text-center text-muted">
          <small>
            Proof-of-Action • Hackathon Demo • Built with ❤️ for the community
          </small>
        </div>
      </footer>
    </div>
  );
}
