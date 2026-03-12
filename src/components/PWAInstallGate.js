'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, AlertCircle } from 'lucide-react';
import { startLocationUpdates } from '@/lib/notifications';

export default function PWAInstallGate({ children }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // PWA in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      // iOS standalone
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
      setIsInstalled(false);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Check if install prompt is available
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Start location tracking when app is installed
  useEffect(() => {
    if (isInstalled) {
      const cleanup = startLocationUpdates(5); // Update every 5 minutes
      return cleanup;
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSGuide(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
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

        {showIOSGuide ? (
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
                  iOS Installation Steps:
                </p>
                <ol style={{ color: 'var(--slate-400)', fontSize: '0.75rem', margin: 0, paddingLeft: '1rem' }}>
                  <li>Tap the Share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install</li>
                </ol>
              </div>
            </div>
            <button 
              onClick={() => setShowIOSGuide(false)}
              className="btn btn-outline-glass w-100 mt-3"
            >
              <X size={16} className="me-2" />
              Close
            </button>
          </div>
        ) : (
          <button 
            onClick={handleInstall}
            className="btn btn-gradient btn-lg w-100"
            disabled={!canInstall && !isIOS}
          >
            <Download size={20} className="me-2" />
            {canInstall || isIOS ? 'Install App' : 'App Install Not Available'}
          </button>
        )}

        {!canInstall && !isIOS && (
          <p style={{
            color: 'var(--slate-500)',
            fontSize: '0.6875rem',
            marginTop: '1rem'
          }}>
            If the install button is disabled, please use Chrome or Edge browser, or add this page to your home screen manually.
          </p>
        )}
      </div>
    </div>
  );
}
