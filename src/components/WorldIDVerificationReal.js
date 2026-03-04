'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, Loader2, Fingerprint } from 'lucide-react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { 
  getWorldIDVerification, 
  saveWorldIDVerification,
  getVerificationBadgeColor,
  getVerificationBadgeText,
  canAccessHighValueFeatures
} from '@/lib/worldid';

/**
 * World ID Verification Component - REAL VERSION
 * Uses actual Worldcoin IDKitWidget for Orb/Device verification
 */

export default function WorldIDVerification({ 
  onVerified, 
  compact = false,
  showBenefits = true 
}) {
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const existing = getWorldIDVerification();
    setVerification(existing);
  }, []);

  const handleSuccess = (result) => {
    console.log('World ID verification successful:', result);
    
    const verificationData = {
      success: true,
      nullifier_hash: result.nullifier_hash,
      proof: result.proof,
      merkle_root: result.merkle_root,
      verification_level: result.verification_level
    };
    
    saveWorldIDVerification(verificationData);
    setVerification(verificationData);
    setIsVerifying(false);
    onVerified?.(verificationData);
  };

  const handleError = (err) => {
    console.error('World ID verification error:', err);
    setError(err.message || 'Verification failed');
    setIsVerifying(false);
  };

  const handleClear = () => {
    localStorage.removeItem('worldid_verification');
    setVerification(null);
  };

  const badgeColor = getVerificationBadgeColor(verification?.verification_level);
  const badgeText = getVerificationBadgeText(verification?.verification_level);
  const isVerified = canAccessHighValueFeatures(verification?.verification_level);

  const app_id = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_9a2bdda755a0a2737f22e311470b1bfa';

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
          {isVerified ? (
            <Check size={14} color={badgeColor} />
          ) : (
            <Shield size={14} color="#64748B" />
          )}
        </div>
        <span style={{ color: isVerified ? badgeColor : '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>
          {isVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Real World ID Widget */}
      <IDKitWidget
        app_id={app_id}
        action="verify-human"
        signal="proof-of-action"
        onSuccess={handleSuccess}
        onError={handleError}
        verification_level={VerificationLevel.Orb}
      >
        {({ open }) => (
          <>
            {/* Header */}
            <div 
              className="p-3 p-md-4"
              style={{ 
                background: isVerified 
                  ? `linear-gradient(135deg, ${badgeColor}15, ${badgeColor}05)` 
                  : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))',
                borderBottom: `1px solid ${isVerified ? `${badgeColor}30` : 'rgba(100, 116, 139, 0.2)'}`
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px',
                    background: isVerified ? `${badgeColor}20` : 'rgba(100, 116, 139, 0.2)',
                    border: `2px solid ${isVerified ? badgeColor : '#64748B'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isVerifying ? (
                    <Loader2 size={24} color="#06B6D4" className="animate-spin" />
                  ) : isVerified ? (
                    <Fingerprint size={24} color={badgeColor} />
                  ) : (
                    <Shield size={24} color="#64748B" />
                  )}
                </div>
                <div>
                  <h5 className="m-0" style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                    {isVerified ? 'Verified Human' : 'Verify Your Identity'}
                  </h5>
                  <p className="m-0" style={{ color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                    {badgeText}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 p-md-4">
              {/* Status Message */}
              {isVerified ? (
                <div 
                  className="p-3 rounded mb-3"
                  style={{ 
                    background: `${badgeColor}10`, 
                    border: `1px solid ${badgeColor}30` 
                  }}
                >
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
                <div 
                  className="p-3 rounded mb-3"
                  style={{ 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    border: '1px solid rgba(245, 158, 11, 0.2)' 
                  }}
                >
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

              {/* Error Message */}
              {error && (
                <div 
                  className="p-3 rounded mb-3"
                  style={{ 
                    background: 'rgba(244, 63, 94, 0.1)', 
                    border: '1px solid rgba(244, 63, 94, 0.2)' 
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <X size={16} color="#F43F5E" />
                    <span style={{ color: '#F43F5E', fontSize: '0.8125rem' }}>{error}</span>
                  </div>
                </div>
              )}

              {/* Benefits List */}
              {showBenefits && (
                <div className="mb-3">
                  <h6 className="mb-2" style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                    Verification Benefits:
                  </h6>
                  <ul className="list-unstyled m-0" style={{ color: 'var(--slate-400)' }}>
                    {[
                      'Priority matching with verified responders',
                      'Ability to post high-value emergency requests',
                      'Increased reputation and trust score',
                      'Access to premium features',
                      'Bot and Sybil-attack protection'
                    ].map((benefit, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 mb-1">
                        <Check 
                          size={12} 
                          color={isVerified ? badgeColor : '#64748B'} 
                          className="flex-shrink-0 mt-1" 
                        />
                        <span style={{ fontSize: '0.75rem' }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="d-flex gap-2">
                {isVerified ? (
                  <>
                    <button 
                      onClick={() => { setIsVerifying(true); open(); }}
                      disabled={isVerifying}
                      className="btn btn-outline-glass flex-fill"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 size={16} className="animate-spin me-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield size={16} className="me-2" />
                          Verify Again
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleClear}
                      className="btn btn-outline-danger"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setIsVerifying(true); open(); }}
                    disabled={isVerifying}
                    className="btn btn-gradient flex-fill d-flex align-items-center justify-content-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Opening World ID...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint size={18} />
                        <span>Verify with World ID</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </IDKitWidget>
    </div>
  );
}
