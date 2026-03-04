'use client';

import { useEffect } from 'react';

/**
 * World ID CSS Loader
 * Loads the required World ID IDKit styles
 */
export default function WorldIDStyles() {
  useEffect(() => {
    // Load World ID IDKit CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@worldcoin/idkit@latest/dist/index.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
}
