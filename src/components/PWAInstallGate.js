'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, AlertCircle } from 'lucide-react';
import { startLocationUpdates } from '@/lib/notifications';

export default function PWAInstallGate({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // PWA install prompt handling (Android/Chrome) and iOS guide
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (e) => {
      // Prevent the mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    // Hydrate from global in case the prompt fired before mount
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }
    if (window.__pwaInstalled) setIsInstalled(true);
    const onCustomBefore = () => {
      if (window.__deferredPwaPrompt) setDeferredPrompt(window.__deferredPwaPrompt);
    };
    const onCustomInstalled = () => setIsInstalled(true);
    window.addEventListener('pwa-beforeinstallprompt', onCustomBefore);
    window.addEventListener('pwa-installed', onCustomInstalled);

    // Detect standalone (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) setIsInstalled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('pwa-beforeinstallprompt', onCustomBefore);
      window.removeEventListener('pwa-installed', onCustomInstalled);
    };
  }, []);

  // Start location tracking when app is installed
  useEffect(() => {
    if (isInstalled) {
      const cleanup = startLocationUpdates(5); // Update every 5 minutes
      return cleanup;
    }
  }, [isInstalled]);

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const handleInstallClick = async () => {
    try {
      if (isIOS) {
        setShowIosGuide(true);
        return;
      }
      if (!deferredPrompt) {
        // Fallback: show Android guide if prompt isn't available
        if (isAndroid) setShowAndroidGuide(true);
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (e) {
      console.warn('PWA install failed', e);
    }
  };

  // If installed, show the app
  if (isInstalled) {
    return children;
  }

  // If not installed, show install gate
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy-950)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div 
          className="animate-pulse-glow"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'var(--gradient-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}
        >
          <img src="/ICON.png" alt="PoA Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
        </div>

        <h1 style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem'
        }}>
          Install Required
        </h1>

        <p style={{
          color: 'var(--slate-400)',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem'
        }}>
          Proof-of-Action must be installed as an app for the best emergency response experience.
        </p>

        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Smartphone size={18} color="var(--cyan-400)" />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
              Why install?
            </span>
          </div>
          <ul style={{
            color: 'var(--slate-400)',
            fontSize: '0.75rem',
            margin: 0,
            paddingLeft: '1.25rem'
          }}>
            <li>Instant emergency alerts</li>
            <li>Works offline</li>
            <li>Location-based notifications</li>
            <li>Native app experience</li>
          </ul>
        </div>

        {/* Install App button - only show if iOS, Android, or deferredPrompt available */}
        {!isInstalled && (isIOS || isAndroid || deferredPrompt) && (
          <button 
            onClick={handleInstallClick}
            className="btn btn-gradient btn-lg w-100"
            style={{ marginBottom: '1rem' }}
          >
            <Download size={20} className="me-2" />
            {isIOS ? 'Add to Home Screen' : 'Install App'}
          </button>
        )}

        {/* iOS Add to Home Screen Guide */}
        {showIosGuide && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'left'
          }}>
            <div className="d-flex align-items-start gap-2">
              <AlertCircle size={18} color="var(--amber-400)" className="flex-shrink-0 mt-1" />
              <div>
                <p style={{ color: 'var(--amber-400)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Add to Home Screen
                </p>
                <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem', lineHeight: 1.6 }}>
                  <p>On iPhone/iPad, install this app by using Safari:</p>
                  <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                    <li>Open this site in Safari.</li>
                    <li>Tap the Share button (square with an up arrow).</li>
                    <li>Choose "Add to Home Screen".</li>
                    <li>Tap Add.</li>
                  </ol>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowIosGuide(false)}
              className="btn btn-outline-glass w-100 mt-3"
            >
              <X size={16} className="me-2" />
              Close
            </button>
          </div>
        )}

        {/* Android Add to Home Screen Guide (fallback when beforeinstallprompt isn't available) */}
        {showAndroidGuide && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'left'
          }}>
            <div className="d-flex align-items-start gap-2">
              <AlertCircle size={18} color="var(--amber-400)" className="flex-shrink-0 mt-1" />
              <div>
                <p style={{ color: 'var(--amber-400)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Add to Home Screen
                </p>
                <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem', lineHeight: 1.6 }}>
                  <p>On Android Chrome:</p>
                  <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                    <li>Open this site in Chrome (not an in-app browser).</li>
                    <li>Tap the three dots (⋮) menu.</li>
                    <li>Select <strong>Add to Home screen</strong> (or <strong>Install app</strong>).</li>
                  </ol>
                  <p style={{ marginTop: '0.5rem' }}>
                    Tip: This requires HTTPS or localhost and a supported browser.
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowAndroidGuide(false)}
              className="btn btn-outline-glass w-100 mt-3"
            >
              <X size={16} className="me-2" />
              Close
            </button>
          </div>
        )}

        {/* Help text for unsupported browsers */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <p style={{
            color: 'var(--slate-500)',
            fontSize: '0.6875rem',
            marginTop: '1rem'
          }}>
            Please use Chrome (Android) or Safari (iOS) to install this app.
          </p>
        )}
    </div>
  </div>
);
}
