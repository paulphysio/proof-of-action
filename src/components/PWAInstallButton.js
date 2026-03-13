'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, AlertCircle } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // PWA install prompt handling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    // Hydrate from global
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

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const handleInstallClick = async () => {
    try {
      if (isIOS) {
        setShowIosGuide(true);
        return;
      }
      if (!deferredPrompt) {
        if (isAndroid) {
          setShowAndroidGuide(true);
        }
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
      }
    } catch (e) {
      console.warn('PWA install failed', e);
    }
  };

  const dismissInstallModal = () => {
    setShowInstallModal(false);
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true))) {
    return null;
  }

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="btn btn-outline-glass d-flex align-items-center gap-2"
        style={{ 
          padding: '0.5rem 1rem', 
          fontSize: '0.75rem',
          position: 'relative'
        }}
      >
        <Download size={16} />
        <span className="d-none d-sm-inline">Install App</span>
        <span className="d-sm-none">Install</span>
      </button>

      {/* Install Modal */}
      {showInstallModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-card" style={{
            maxWidth: '400px',
            width: '90%',
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

            <h2 style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              Install Proof-of-Action
            </h2>

            <p style={{
              color: 'var(--slate-400)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem'
            }}>
              Install our app for the best emergency response experience with instant notifications and offline support.
            </p>

            <button 
              onClick={handleInstallClick}
              className="btn btn-gradient btn-lg w-100"
              style={{ marginBottom: '1rem' }}
            >
              <Download size={20} className="me-2" />
              {isIOS ? 'Add to Home Screen' : 'Install App'}
            </button>

            <button 
              onClick={dismissInstallModal}
              className="btn btn-outline-glass w-100"
            >
              Maybe Later
            </button>

            {/* iOS Guide */}
            {showIosGuide && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}>
                <div className="glass-card" style={{
                  maxWidth: '400px',
                  width: '90%',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div className="d-flex align-items-start gap-2 mb-3">
                    <AlertCircle size={18} color="var(--amber-400)" className="flex-shrink-0 mt-1" />
                    <div>
                      <h3 style={{ color: 'var(--amber-400)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                        Add to Home Screen
                      </h3>
                      <div style={{ color: 'var(--slate-400)', fontSize: '0.875rem', lineHeight: 1.6 }}>
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
                    className="btn btn-outline-glass w-100"
                  >
                    <X size={16} className="me-2" />
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Android Guide */}
            {showAndroidGuide && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}>
                <div className="glass-card" style={{
                  maxWidth: '400px',
                  width: '90%',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div className="d-flex align-items-start gap-2 mb-3">
                    <AlertCircle size={18} color="var(--amber-400)" className="flex-shrink-0 mt-1" />
                    <div>
                      <h3 style={{ color: 'var(--amber-400)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                        Add to Home Screen
                      </h3>
                      <div style={{ color: 'var(--slate-400)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        <p>On Android Chrome:</p>
                        <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                          <li>Open this site in Chrome (not an in-app browser).</li>
                          <li>Tap the three dots (⋮) menu.</li>
                          <li>Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                        </ol>
                        <p style={{ marginTop: '0.5rem' }}>
                          Tip: This requires HTTPS or localhost and a supported browser.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAndroidGuide(false)}
                    className="btn btn-outline-glass w-100"
                  >
                    <X size={16} className="me-2" />
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
