'use client';

import { useState, useCallback, useEffect } from 'react';
import { Shield, Check, X, Loader2, Fingerprint, QrCode } from 'lucide-react';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { 
  getWorldIDVerification, 
  saveWorldIDVerification,
  getVerificationBadgeColor,
  getVerificationBadgeText,
  canAccessHighValueFeatures
} from '@/lib/worldid';

/**
 * Simplified World ID Widget Component
 * Uses IDKitRequestWidget with proper error handling and debugging
 */
export default function WorldIDWidget({ onVerified }) {
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState(null);
  const [loading, setLoading] = useState(false);

  console.log('WorldIDWidget mounted');
  
  // Debug environment variables
  console.log('Environment check:', {
    rpId: process.env.NEXT_PUBLIC_RP_ID,
    appId: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
    hasRpId: !!process.env.NEXT_PUBLIC_RP_ID,
    hasAppId: !!process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID
  });

  // Load existing verification on mount
  useEffect(() => {
    const existing = getWorldIDVerification();
    if (existing) {
      setVerification(existing);
    }
  }, []);

  // Pre-fetch RP signature when component mounts
  useEffect(() => {
    const fetchRpSignature = async () => {
      if (rpContext) return;

      setLoading(true);
      try {
        console.log('Pre-fetching RP signature...');
        
        const response = await fetch('/api/rp-signature', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'verify-human' }),
        });

        console.log('RP signature response status:', response.status);
        console.log('RP signature response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('RP signature error response:', errorData);
          throw new Error(errorData.error || `Failed to get RP signature (${response.status})`);
        }

        const rpSig = await response.json();
        console.log('RP signature received:', rpSig);
        
        // Check environment variables
        const rpId = process.env.NEXT_PUBLIC_RP_ID;
        const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
        console.log('NEXT_PUBLIC_RP_ID:', rpId);
        console.log('NEXT_PUBLIC_WORLDCOIN_APP_ID:', appId);
        
        if (!rpId) {
          throw new Error('NEXT_PUBLIC_RP_ID is not configured');
        }
        
        if (!appId) {
          throw new Error('NEXT_PUBLIC_WORLDCOIN_APP_ID is not configured');
        }
        
        const context = {
          rp_id: rpId,
          nonce: rpSig.nonce,
          created_at: rpSig.created_at,
          expires_at: rpSig.expires_at,
          signature: rpSig.sig,
        };

        console.log('RP context created:', context);
        setRpContext(context);
      } catch (error) {
        console.error('Failed to fetch RP signature:', error);
        setError(error.message || 'Failed to prepare verification');
      } finally {
        setLoading(false);
      }
    };

    fetchRpSignature();
  }, []);

  const handleVerify = useCallback(() => {
    console.log('handleVerify called');
    if (!rpContext) {
      setError('Not ready to verify. Please try again.');
      return;
    }
    setIsVerifying(true);
    setError(null);
    setWidgetOpen(true);
  }, [rpContext]);

  const handleWidgetVerify = useCallback(async (result) => {
    try {
      console.log('World ID widget result:', result);

      // Forward to backend for verification
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rp_id: process.env.NEXT_PUBLIC_RP_ID,
          idkitResponse: result,
        }),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errPayload = await response.json();
          detail = errPayload?.detail || errPayload?.error || JSON.stringify(errPayload);
        } catch {
          detail = await response.text();
        }
        throw new Error(`Proof verification failed (${response.status}): ${detail}`);
      }

      const verifyResult = await response.json();

      if (verifyResult.success) {
        // Extract proof data from result
        const proofData = result.responses?.[0] || result;
        
        const verificationData = {
          success: true,
          nullifier_hash: proofData?.nullifier || proofData?.nullifier_hash,
          proof: proofData?.proof,
          merkle_root: proofData?.merkle_root,
          verification_level: 'orbLegacy',
        };
        
        saveWorldIDVerification(verificationData);
        setVerification(verificationData);
        setWidgetOpen(false);
        setIsVerifying(false);
        onVerified?.(verificationData);
      } else {
        throw new Error(verifyResult.detail || 'Verification failed');
      }
    } catch (err) {
      console.error('World ID error:', err);
      setError(err.message);
      setWidgetOpen(false);
      setIsVerifying(false);
    }
  }, [onVerified]);

  const handleWidgetSuccess = useCallback((result) => {
    console.log('World ID widget success:', result);
    handleWidgetVerify(result);
  }, [handleWidgetVerify]);

  const handleWidgetError = useCallback((error) => {
    console.error('World ID widget error:', error);
    setError(error.message || 'Verification failed');
    setWidgetOpen(false);
    setIsVerifying(false);
  }, []);

  const clearError = () => setError(null);

  // UI state
  const isVerified = !!verification?.success;
  const badgeColor = getVerificationBadgeColor(verification?.verification_level);
  const badgeText = getVerificationBadgeText(verification?.verification_level);
  const canAccessPremium = canAccessHighValueFeatures(verification?.verification_level);

  console.log('WorldIDWidgetComponent rendered, open:', widgetOpen);

  return (
    <>
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
                {loading && (
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                    <Loader2 className="animate-spin" />
                    <span style={{ color: 'var(--slate-400)' }}>Preparing verification...</span>
                  </div>
                )}
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
                disabled={isVerifying || loading || !rpContext}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    <span>Verify with World ID</span>
                  </>
                )}
              </button>
            )}

            {/* Benefits */}
            {!isVerified && (
              <div className="mt-3">
                <h6 className="m-0 mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Benefits:</h6>
                <ul className="m-0 ps-3" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                  <li>Access to high-value features</li>
                  <li>Enhanced reputation score</li>
                  <li>Exclusive reward opportunities</li>
                  <li>Proof of humanity verification</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* World ID Widget */}
      {rpContext && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}
          action="verify-human"
          rp_context={rpContext}
          allow_legacy_proofs={true}
          environment="staging" // Use staging for testing
          preset={orbLegacy({ signal: 'proof-of-action' })}
          handleVerify={handleWidgetVerify}
          onSuccess={handleWidgetSuccess}
          onError={handleWidgetError}
        />
      )}
    </>
  );
}
