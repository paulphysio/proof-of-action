'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Check, X, Loader2, Fingerprint } from 'lucide-react';
import { IDKit, deviceLegacy } from '@worldcoin/idkit-core';
import { 
  getWorldIDVerification, 
  saveWorldIDVerification,
  getVerificationBadgeColor,
  getVerificationBadgeText,
  canAccessHighValueFeatures
} from '@/lib/worldid';

/**
 * World ID Verification Component - REAL VERSION
 * Uses @worldcoin/idkit-core for proper verification
 */

const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;

const RP_ID = (process.env.NEXT_PUBLIC_RP_ID || '').trim();

if (!RP_ID || !RP_ID.startsWith('rp_')) {
  // Don't crash the whole page in production builds; show an actionable error in the UI flow.
  // IDKit will also throw, but this makes the misconfig obvious.
  console.warn('Invalid NEXT_PUBLIC_RP_ID:', RP_ID);
}

export default function WorldIDVerification({ 
  onVerified, 
  compact = false,
  showBenefits = true 
}) {
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    const existing = getWorldIDVerification();
    setVerification(existing);
  }, []);

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    setQrCodeUrl(null);

    try {
      if (!RP_ID || !RP_ID.startsWith('rp_')) {
        throw new Error(`Invalid RP ID configured: "${RP_ID}". Set NEXT_PUBLIC_RP_ID to your Developer Portal rp_id (starts with "rp_").`);
      }

      // Step 1: Get RP signature from backend (following official docs)
      const rpSig = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'verify-human' }),
      }).then((r) => r.json());

      // Step 2: Create IDKit request with rp_context (following official docs)
      console.log('World ID config:', { app_id: APP_ID, rp_id: RP_ID, action: 'verify-human' });
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
        environment: 'staging',
      }).preset(deviceLegacy({ signal: 'proof-of-action' }));

      // Step 3: Get connector URL and show QR
      const connectUrl = request.connectorURI;
      console.log('Generated connector URI:', connectUrl);
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(connectUrl)}`;
      console.log('QR code URL:', qrApiUrl);
      setQrCodeUrl(qrApiUrl);

      // Step 4: Poll for completion with timeout
      console.log('Starting polling for World ID verification...');
      const pollPromise = request.pollUntilCompletion();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('QR code verification timed out after 2 minutes')), 120000)
      );
      
      let response;
      try {
        response = await Promise.race([pollPromise, timeoutPromise]);
        console.log('Polling completed successfully:', response);
      } catch (pollError) {
        console.error('Polling failed with error:', pollError);
        console.error('Error details:', {
          message: pollError.message,
          stack: pollError.stack,
          name: pollError.name
        });
        throw pollError;
      }

      console.log('World ID raw pollUntilCompletion response:', response);

      if (response?.success === false) {
        const err = response?.error || 'World ID verification failed';
        if (err === 'credential_unavailable') {
          throw new Error('Device verification failed. Try again or use Orb verification in production.');
        }
        throw new Error(err);
      }

      // Step 5: Verify proof in backend (following official docs)
      // IDKit may return different response shapes depending on proof type.
      // World verify endpoint requires `action` and, for legacy proofs, a `responses` array.
      let idkitResponse = {
        ...response,
        action: response?.action || 'verify-human',
      };

      console.log('Full response structure:', response);
      console.log('Has response.result?', !!response?.result);
      console.log('Has response.responses?', !!response?.responses);
      console.log('Has response.result.responses?', !!response?.result?.responses);

      // For deviceLegacy, response shape is { success: true, result: { ... } }
      // The result object contains the proof fields directly
      if (response?.result?.responses && Array.isArray(response.result.responses)) {
        // deviceLegacy sometimes returns { success: true, result: { responses: [ ... ] } }
        const proof = response.result.responses[0];
        
        console.log('DeviceLegacy proof from result.responses[0]:', proof);
        
        const merkleRoot = proof?.merkle_root || proof?.merkleRoot;
        const encodedProof = proof?.proof || proof?.encoded_proof || proof?.encodedProof;
        const nullifier = proof?.nullifier || proof?.nullifier_hash || proof?.nullifierHash;
        const signalHash = proof?.signal_hash || proof?.signalHash;

        if (!merkleRoot || !encodedProof || !nullifier) {
          console.warn('DeviceLegacy result.responses[0] missing expected v3 fields:', proof);
        }

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
      } else if (response?.result && !Array.isArray(response.responses)) {
        const proof = response.result;

        const merkleRoot = proof?.merkle_root || proof?.merkleRoot;
        const encodedProof = proof?.proof || proof?.encoded_proof || proof?.encodedProof;
        const nullifier = proof?.nullifier || proof?.nullifier_hash || proof?.nullifierHash;
        const signalHash = proof?.signal_hash || proof?.signalHash;

        if (!merkleRoot || !encodedProof || !nullifier) {
          console.warn('DeviceLegacy result missing expected v3 fields:', proof);
        }

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
      } else if (!Array.isArray(idkitResponse.responses) || idkitResponse.responses.length === 0) {
        const proof = response?.proof;
        const proofLike = proof || response;

        const merkleRoot = proofLike?.merkle_root || proofLike?.merkleRoot;
        const encodedProof = proofLike?.proof || proofLike?.encoded_proof || proofLike?.encodedProof;
        const nullifier =
          proofLike?.nullifier ||
          proofLike?.nullifier_hash ||
          proofLike?.nullifierHash ||
          proofLike?.nullifier_hash;
        const signalHash = proofLike?.signal_hash || proofLike?.signalHash;

        // Some response shapes put proof fields at the top-level.
        // If we can infer the required fields, construct a legacy v3 `responses` array.
        if (merkleRoot && encodedProof && nullifier) {
          idkitResponse = {
            protocol_version: response?.protocol_version || '3.0',
            nonce: response?.nonce || rpSig.nonce,
            action: idkitResponse.action,
            environment: 'production',
            responses: [
              {
                identifier: proofLike?.identifier || proofLike?.verification_level || 'orb',
                signal_hash: signalHash,
                proof: encodedProof,
                merkle_root: merkleRoot,
                nullifier,
              },
            ],
          };
        }
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
        // For deviceLegacy, proof is in response.result.responses[0]
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
        setQrCodeUrl(null);
        onVerified?.(verificationData);
      } else {
        throw new Error(verifyResult.detail || 'Verification failed');
      }
    } catch (err) {
      console.error('World ID error:', err);
      console.error('Full error object:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        timestamp: new Date().toISOString()
      });
      setError(err.message || 'Verification failed or cancelled');
      setQrCodeUrl(null);
    } finally {
      setIsVerifying(false);
    }
  }, [onVerified]);

  const handleCancel = () => {
    setQrCodeUrl(null);
    setIsVerifying(false);
    setError('Verification cancelled');
  };

  const handleClear = () => {
    localStorage.removeItem('worldid_verification');
    setVerification(null);
    setQrCodeUrl(null);
  };

  const badgeColor = getVerificationBadgeColor(verification?.verification_level);
  const badgeText = getVerificationBadgeText(verification?.verification_level);
  const isVerified = canAccessHighValueFeatures(verification?.verification_level);

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%',
            background: isVerified ? `${badgeColor}20` : 'rgba(100, 116, 139, 0.2)',
            border: `1px solid ${isVerified ? badgeColor : '#64748B'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isVerified ? <Check size={14} color={badgeColor} /> : <Shield size={14} color="#64748B" />}
        </div>
        <span style={{ color: isVerified ? badgeColor : '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>
          {isVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* QR Code Modal */}
      {qrCodeUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <Fingerprint size={48} color="#4940e0" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#1a1a1a', marginBottom: '8px' }}>Verify with World ID</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Scan this QR code with your World App to verify your identity
            </p>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #eee'
            }}>
              <img 
                src={qrCodeUrl}
                alt="World ID QR Code"
                style={{ width: '200px', height: '200px' }}
              />
            </div>

            <p style={{ color: '#999', fontSize: '12px', marginBottom: '20px' }}>
              Waiting for verification... Keep this window open
            </p>

            <button 
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-3 p-md-4" style={{ 
        background: isVerified 
          ? `linear-gradient(135deg, ${badgeColor}15, ${badgeColor}05)` 
          : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))',
        borderBottom: `1px solid ${isVerified ? `${badgeColor}30` : 'rgba(100, 116, 139, 0.2)'}`
      }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px',
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
      </div>

      <div className="p-3 p-md-4">
        {isVerified ? (
          <div className="p-3 rounded mb-3" style={{ background: `${badgeColor}10`, border: `1px solid ${badgeColor}30` }}>
            <div className="d-flex align-items-start gap-2">
              <Check size={16} color={badgeColor} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="m-0" style={{ color: badgeColor, fontSize: '0.875rem', fontWeight: 500 }}>
                  Your identity is verified
                </p>
                <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                  You have full access to all features and can create high-priority emergency requests.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="d-flex align-items-start gap-2">
              <Shield size={16} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="m-0" style={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: 500 }}>
                  Verification recommended
                </p>
                <p className="m-0 mt-1" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                  Verified users get priority matching and can post high-value requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded mb-3" style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <div className="d-flex align-items-center gap-2">
              <X size={16} color="#F43F5E" />
              <span style={{ color: '#F43F5E', fontSize: '0.8125rem' }}>{error}</span>
            </div>
          </div>
        )}

        {showBenefits && (
          <div className="mb-3">
            <h6 className="mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Benefits:</h6>
            <ul className="list-unstyled m-0" style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
              <li className="mb-1">✓ Priority matching with verified responders</li>
              <li className="mb-1">✓ Post high-value emergency requests</li>
              <li className="mb-1">✓ Increased reputation score</li>
              <li>✓ Bot and Sybil protection</li>
            </ul>
          </div>
        )}

        <div className="d-flex gap-2">
          {isVerified ? (
            <>
              <button onClick={handleVerify} disabled={isVerifying} className="btn btn-outline-glass flex-fill">
                {isVerifying ? <><Loader2 size={16} className="animate-spin me-2" />Verifying...</>
                  : <><Shield size={16} className="me-2" />Verify Again</>}
              </button>
              <button onClick={handleClear} className="btn btn-outline-danger"><X size={16} /></button>
            </>
          ) : (
            <button onClick={handleVerify} disabled={isVerifying} className="btn btn-gradient w-100 d-flex align-items-center justify-content-center gap-2">
              {isVerifying ? <><Loader2 size={18} className="animate-spin" /><span>Connecting...</span></>
                : <><Fingerprint size={18} /><span>Verify with World ID</span></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
