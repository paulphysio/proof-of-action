'use client';

import { useState, useCallback, useEffect } from 'react';
import { Shield, Check, X, Loader2, Fingerprint, Smartphone, Rocket, Zap, RefreshCw } from 'lucide-react';
import { IDKit, deviceLegacy } from '@worldcoin/idkit-core';
import { 
  getWorldIDVerification, 
  saveWorldIDVerification,
  getVerificationBadgeColor,
  getVerificationBadgeText,
  canAccessHighValueFeatures
} from '@/lib/worldid';

/**
 * World ID Mobile Component - Mobile-First UX with Deep Link
 * Uses IDKit core with deep link instead of QR code for better mobile experience
 */
export default function WorldIDMobile({ onVerified }) {
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  // Load existing verification on mount
  useEffect(() => {
    const existing = getWorldIDVerification();
    if (existing) {
      setVerification(existing);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
      const RP_ID = process.env.NEXT_PUBLIC_RP_ID;

      if (!APP_ID || !RP_ID) {
        throw new Error('World ID environment variables not configured');
      }

      console.log('World ID config:', { app_id: APP_ID, rp_id: RP_ID, action: 'verify-human' });

      // Step 1: Get RP signature from backend
      const rpSig = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'verify-human' }),
      }).then((r) => r.json());

      // Step 2: Create IDKit request with rp_context
      const request = await IDKit.request({
        app_id: APP_ID,
        action: 'verify-human',
        rp_context: {
          rp_id: RP_ID,
          nonce: rpSig.nonce,
          created_at: rpSig.created_at,
          expires_at: rpSig.expires_at,
          signature: rpSig.sig,
        },
        allow_legacy_proofs: true,
        environment: 'production',
      }).preset(deviceLegacy({ signal: 'proof-of-action' }));

      // Step 3: Get connector URI and open directly in mobile browser
      const connectUrl = request.connectorURI;
      
      // For mobile, open the connect URL directly in the same tab
      // This will redirect to World App if installed, or show mobile web version
      window.location.href = connectUrl;

      // Step 4: Poll for completion
      const response = await request.pollUntilCompletion();

      console.log('World ID raw pollUntilCompletion response:', response);

      if (response?.success === false) {
        const err = response?.error || 'World ID verification failed';
        if (err === 'credential_unavailable') {
          throw new Error('Device verification failed. Try again or use Orb verification in production.');
        }
        throw new Error(err);
      }

      // Step 5: Verify proof in backend
      let idkitResponse = {
        ...response,
        action: response?.action || 'verify-human',
      };

      // Handle deviceLegacy response structure
      if (response?.result?.responses && Array.isArray(response.result.responses)) {
        const proof = response.result.responses[0];
        
        const merkleRoot = proof?.merkle_root || proof?.merkleRoot;
        const encodedProof = proof?.proof || proof?.encoded_proof || proof?.encodedProof;
        const nullifier = proof?.nullifier || proof?.nullifier_hash || proof?.nullifierHash;
        const signalHash = proof?.signal_hash || proof?.signalHash;

        idkitResponse = {
          protocol_version: response?.protocol_version || '3.0',
          nonce: response?.nonce || rpSig.nonce,
          action: idkitResponse.action,
          environment: 'production',
          responses: [
            {
              identifier: proof?.identifier || proof?.verification_level || 'device',
              signal_hash: signalHash,
              proof: encodedProof,
              merkle_root: merkleRoot,
              nullifier,
            },
          ],
        };
      }

      console.log('World ID payload forwarded to verify-proof:', idkitResponse);

      const verifyResponse = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rp_id: RP_ID,
          idkitResponse,
        }),
      });

      if (!verifyResponse.ok) {
        let detail = '';
        try {
          const errPayload = await verifyResponse.json();
          detail = errPayload?.detail || errPayload?.error || JSON.stringify(errPayload);
        } catch {
          detail = await verifyResponse.text();
        }
        throw new Error(`Proof verification failed (${verifyResponse.status}): ${detail}`);
      }

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        // Extract proof data from response
        const proofData = response.result?.responses?.[0] || response.result || response.responses?.[0] || response;
        
        const verificationData = {
          success: true,
          nullifier_hash: proofData?.nullifier || proofData?.nullifier_hash,
          proof: proofData?.proof,
          merkle_root: proofData?.merkle_root,
          verification_level: 'deviceLegacy',
        };
        
        saveWorldIDVerification(verificationData);
        setVerification(verificationData);
        onVerified?.(verificationData);
      } else {
        throw new Error(verifyResult.detail || 'Verification failed');
      }
    } catch (err) {
      console.error('World ID error:', err);
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }, [onVerified]);

  const clearError = () => setError(null);

  // UI state
  const isVerified = !!verification?.success;
  const badgeColor = getVerificationBadgeColor(verification?.verification_level);
  const badgeText = getVerificationBadgeText(verification?.verification_level);
  const canAccessPremium = canAccessHighValueFeatures(verification?.verification_level);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-md-4">
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '48px', 
              height: '48px',
              background: isVerified ? `${badgeColor}20` : 'rgba(100, 116, 139, 0.2)',
              border: `2px solid ${isVerified ? badgeColor : '#64748B'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {isVerifying ? <Loader2 size={24} color="#06B6D4" className="animate-spin" />
              : isVerified ? <Fingerprint size={24} color={badgeColor} />
              : <Shield size={24} color="#64748B" />}
          </div>
          <div>
            <h5 className="m-0" style={{ color: 'white', fontWeight: 600 }}>
              {isVerified ? 'Verified Human' : 'Verify with World ID'}
            </h5>
            <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
              {badgeText}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 p-md-4">
          {isVerified ? (
            <div className="p-3 rounded mb-3" style={{ background: `${badgeColor}10`, border: `1px solid ${badgeColor}30` }}>
              <div className="d-flex align-items-start gap-2">
                <Check size={16} color={badgeColor} className="flex-shrink-0 mt-0.5" />
                <div>
                  <h6 className="m-0" style={{ color: 'white', fontWeight: 600 }}>Verification Complete</h6>
                  <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                    Your humanity has been verified with World ID. You now have access to all premium features.
                  </p>
                  {verification?.nullifier_hash && (
                    <div className="mt-2 p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <p className="m-0" style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        Nullifier: {verification.nullifier_hash.slice(0, 10)}...{verification.nullifier_hash.slice(-8)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-3">
              <Shield size={48} color="#64748B" className="mb-3" />
              <h6 className="m-0 mb-2" style={{ color: 'white', fontWeight: 600 }}>Verify Your Humanity</h6>
              <p className="m-0 mb-3" style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                Prove you're a real human with World ID to unlock premium features and enhance your reputation.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <X size={16} className="flex-shrink-0" />
              <div className="flex-grow-1">
                <p className="m-0 fw-semibold">Verification Failed</p>
                <p className="m-0 small">{error}</p>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white"
                onClick={clearError}
              />
            </div>
          )}

          {/* Action Button */}
          {!isVerified && (
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Redirecting to World ID...</span>
                </>
              ) : (
                <>
                  <Fingerprint size={18} />
                  <span>Verify with World ID</span>
                </>
              )}
            </button>
          )}

          {/* Benefits */}
          {!isVerified && (
            <div className="mt-3">
              <h6 className="m-0 mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Mobile Benefits:</h6>
              <ul className="m-0 ps-3" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                <li><Smartphone size={14} className="me-1" /> Direct redirect to World ID</li>
                <li><Rocket size={14} className="me-1" /> Single device verification</li>
                <li><Zap size={14} className="me-1" /> No QR code scanning needed</li>
                <li><RefreshCw size={14} className="me-1" /> Seamless mobile experience</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
