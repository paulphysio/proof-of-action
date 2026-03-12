'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, AlertCircle, ExternalLink } from 'lucide-react';
import { startLocationUpdates } from '@/lib/notifications';
import { useRouter } from 'next/navigation';

export default function PWAInstallGate({ children }) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showOpenInstalledModal, setShowOpenInstalledModal] = useState(false);

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

    // Show install modal in Chrome if not installed
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
    if (!isStandalone && isChrome && !deferredPrompt) {
      setShowInstallModal(true);
    }

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
      const cleanup = startLocationUpdates(5);
      return cleanup;
    }
  }, [isInstalled]);

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Check if current page is home page
  const isHomePage = currentPath === '/' || currentPath === '/dashboard';

  const handleInstallClick = async () => {
    try {
      if (isIOS) {
        setShowIosGuide(true);
        setShowInstallModal(false);
        return;
      }
      if (!deferredPrompt) {
        if (isAndroid) {
          setShowAndroidGuide(true);
          setShowInstallModal(false);
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

  const openInstalledPWA = () => {
    if (typeof window !== 'undefined') {
      if (isIOS) {
        window.location.href = window.location.origin + '/?standalone=1';
      } else {
        window.open(window.location.origin, '_blank');
      }
    }
    setShowOpenInstalledModal(false);
  };

  const dismissInstallModal = () => {
    setShowInstallModal(false);
  };

  const dismissOpenInstalledModal = () => {
    setShowOpenInstalledModal(false);
  };

  // If on home page, always show children
  if (isHomePage) {
    return children;
  }

  // If on other pages, check if PWA is installed
  if (!isHomePage && !isInstalled) {
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
            PWA Required
          </h1>

          <p style={{
            color: 'var(--slate-400)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem'
          }}>
            This feature requires the Proof-of-Action app to be installed.
          </p>

          <button 
            onClick={() => setShowInstallModal(true)}
            className="btn btn-gradient btn-lg w-100"
          >
            <Download size={20} className="me-2" />
            Install App
          </button>
        </div>
      </div>
    );
  }

  // If on other pages and PWA is installed, show children
  if (!isHomePage && isInstalled) {
    return children;
  }

  // Show install modal
  if (showInstallModal) {
    return (
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
    );
  }

  // Show open installed modal
  if (showOpenInstalledModal) {
    return (
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
            <Smartphone size={40} color="white" />
          </div>

          <h2 style={{
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            App Already Installed
          </h2>

          <p style={{
            color: 'var(--slate-400)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem'
          }}>
            Proof-of-Action is already installed on your device. Open the installed app for the full experience.
          </p>

          <button 
            onClick={openInstalledPWA}
            className="btn btn-gradient btn-lg w-100"
            style={{ marginBottom: '1rem' }}
          >
            <ExternalLink size={20} className="me-2" />
            Open Installed App
          </button>

          <button 
            onClick={dismissOpenInstalledModal}
            className="btn btn-outline-glass w-100"
          >
            Continue in Browser
          </button>
        </div>
      </div>
    );
  }

  // Default: show children
  return children;
}
