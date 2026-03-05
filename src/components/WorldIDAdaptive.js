
'use client';

import { useEffect, useMemo, useState } from 'react';
import WorldIDMobile from '@/components/WorldIDMobile';
import WorldIDReactWidget from '@/components/WorldIDReactWidget';

function detectMobile() {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const uaIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 0;
  const smallViewport = window.matchMedia?.('(max-width: 768px)')?.matches ?? (window.innerWidth <= 768);

  // Primary signal: UA, then support iPadOS / touch laptops via viewport + touch.
  return uaIsMobile || (hasTouch && smallViewport);
}

export default function WorldIDAdaptive({ onVerified }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(detectMobile());
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const Component = useMemo(() => {
    // Hard rule: never show QR on mobile.
    // Desktop uses the official React widget (which reliably supports QR scanning).
    return isMobile ? WorldIDMobile : WorldIDReactWidget;
  }, [isMobile]);

  return <Component onVerified={onVerified} />;
}
