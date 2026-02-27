'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, User, Activity, Radio } from 'lucide-react';

/**
 * Real-Time Responder Map
 * Shows responder's live location moving toward the requester
 * Used on the request page so requester can track help coming
 */
export default function ResponderLiveMap({ 
  requesterLocation, 
  responderLocations, 
  responderWallet,
  isTracking 
}) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef(null);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    
    canvas.width = width * 2; // Retina support
    canvas.height = height * 2;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(2, 2);

    let frame = 0;
    
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate bounds
      const padding = 60;
      let minLat, maxLat, minLon, maxLon;
      
      if (responderLocations?.length > 0 && requesterLocation) {
        const allLats = [...responderLocations.map(l => l.lat), requesterLocation.lat];
        const allLons = [...responderLocations.map(l => l.lon), requesterLocation.lon];
        minLat = Math.min(...allLats);
        maxLat = Math.max(...allLats);
        minLon = Math.min(...allLons);
        maxLon = Math.max(...allLons);
      } else if (requesterLocation) {
        minLat = requesterLocation.lat - 0.01;
        maxLat = requesterLocation.lat + 0.01;
        minLon = requesterLocation.lon - 0.01;
        maxLon = requesterLocation.lon + 0.01;
      } else {
        return;
      }

      // Add padding to bounds
      const latRange = maxLat - minLat || 0.02;
      const lonRange = maxLon - minLon || 0.02;
      const maxRange = Math.max(latRange, lonRange);
      const paddedRange = maxRange * 1.3;
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      
      const scaleX = (width - padding * 2) / paddedRange;
      const scaleY = (height - padding * 2) / paddedRange;
      const scale = Math.min(scaleX, scaleY);

      const toX = (lon) => width / 2 + (lon - centerLon) * scale;
      const toY = (lat) => height / 2 - (lat - centerLat) * scale;

      // Draw path trail
      if (responderLocations?.length > 1) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        responderLocations.forEach((loc, i) => {
          if (i === 0) ctx.moveTo(toX(loc.lon), toY(loc.lat));
          else ctx.lineTo(toX(loc.lon), toY(loc.lat));
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw requester location (static)
      if (requesterLocation) {
        const x = toX(requesterLocation.lon);
        const y = toY(requesterLocation.lat);

        // Pulsing ring
        const pulseSize = 20 + Math.sin(frame * 0.05) * 5;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 - Math.sin(frame * 0.05) * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('You', x, y + 30);
      }

      // Draw responder location (animated)
      const latestLocation = responderLocations?.[responderLocations.length - 1];
      if (latestLocation) {
        const x = toX(latestLocation.lon);
        const y = toY(latestLocation.lat);

        // Pulsing effect when tracking
        if (isTracking) {
          const pulseSize = 25 + Math.sin(frame * 0.1) * 8;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 - Math.sin(frame * 0.1) * 0.15})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Responder dot
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#06B6D4';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Direction indicator
        if (responderLocations.length > 1) {
          const prev = responderLocations[responderLocations.length - 2];
          const angle = Math.atan2(latestLocation.lat - prev.lat, latestLocation.lon - prev.lon);
          const arrowLen = 15;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * arrowLen, y - Math.sin(angle) * arrowLen);
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Helper', x, y - 25);
        ctx.fillStyle = 'var(--slate-400)';
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillText(responderWallet?.slice(0, 6) + '...', x, y - 12);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, requesterLocation, responderLocations, responderWallet, isTracking]);

  return (
    <div className="glass-card overflow-hidden" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
      {/* Header */}
      <div 
        className="px-3 py-2 d-flex align-items-center justify-content-between"
        style={{ 
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05))',
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div 
            className="animate-pulse"
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isTracking ? '#10B981' : '#F59E0B'
            }} 
          />
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8125rem' }}>
            {isTracking ? 'Live Tracking' : 'Waiting for Response'}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Radio size={14} color="#06B6D4" />
          <span style={{ color: 'var(--slate-400)', fontSize: '0.6875rem' }}>
            {responderLocations?.length || 0} updates
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div style={{ position: 'relative', height: '280px' }}>
        <canvas 
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        />
        
        {/* Legend */}
        <div 
          className="position-absolute"
          style={{ 
            bottom: '12px', 
            left: '12px',
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <span style={{ color: 'var(--slate-300)', fontSize: '0.6875rem' }}>You</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06B6D4', border: '1px solid #fff' }} />
              <span style={{ color: 'var(--slate-300)', fontSize: '0.6875rem' }}>Helper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
