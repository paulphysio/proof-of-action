'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';

/**
 * Route Map
 * Shows route from responder's location to requester's location
 * Used on the respond page so responder can see the path to navigate
 */
export default function RequesterStaticMap({ 
  requesterLocation, 
  requesterGeohash,
  requestType,
  requestTime,
  responderLocation = null
}) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 35;
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

    // Calculate map bounds to include both locations
    const padding = 50;
    const mapRange = 0.015; // Larger range to show route
    
    // Center map between responder and requester
    let centerLat = requesterLocation?.lat || 40.7128;
    let centerLon = requesterLocation?.lon || -74.0060;
    
    // If responder location is available, center between them
    if (responderLocation) {
      centerLat = (centerLat + responderLocation.lat) / 2;
      centerLon = (centerLon + responderLocation.lon) / 2;
    }
    
    const scaleX = (width - padding * 2) / mapRange;
    const scaleY = (height - padding * 2) / mapRange;
    const scale = Math.min(scaleX, scaleY);

    const toX = (lon) => width / 2 + (lon - centerLon) * scale;
    const toY = (lat) => height / 2 - (lat - centerLat) * scale;

    // Draw route line from responder to requester
    if (responderLocation) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Draw curved route line
      ctx.beginPath();
      ctx.moveTo(toX(responderLocation.lon), toY(responderLocation.lat));
      
      // Add curve for more natural route appearance
      const midX = (toX(responderLocation.lon) + toX(centerLon)) / 2;
      const midY = (toY(responderLocation.lat) + toY(centerLat)) / 2;
      const curveOffset = 20;
      
      ctx.quadraticCurveTo(
        midX + curveOffset, 
        midY - curveOffset, 
        toX(centerLon), 
        toY(centerLat)
      );
      ctx.stroke();
      
      // Draw route dots
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = (1-t)*(1-t)*toX(responderLocation.lon) + 2*(1-t)*t*(midX + curveOffset) + t*t*toX(centerLon);
        const y = (1-t)*(1-t)*toY(responderLocation.lat) + 2*(1-t)*t*(midY - curveOffset) + t*t*toY(centerLat);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw geohash area (approximate)
    const geohashSize = 0.002; // Approx geohash size
    const geohashHalf = geohashSize / 2;
    
    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    const ghX = toX(centerLon - geohashHalf);
    const ghY = toY(centerLat + geohashHalf);
    const ghW = (geohashSize * scale);
    const ghH = (geohashSize * scale);
    
    ctx.fillRect(ghX, ghY, ghW, ghH);
    ctx.strokeRect(ghX, ghY, ghW, ghH);
    ctx.setLineDash([]);

    // Draw concentric circles for distance reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [100, 200, 300].forEach((meters, i) => {
      const radius = (meters / 111000) * scale; // Rough conversion
      ctx.beginPath();
      ctx.arc(toX(centerLon), toY(centerLat), radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Distance label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${meters}m`, toX(centerLon) + radius + 5, toY(centerLat) - 5);
    });

    // Draw responder location (if available)
    if (responderLocation) {
      const respX = toX(responderLocation.lon);
      const respY = toY(responderLocation.lat);

      // Responder location circle (blue)
      ctx.beginPath();
      ctx.arc(respX, respY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Responder label
      ctx.fillStyle = 'rgba(6, 182, 212, 1)';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', respX, respY - 15);
    }

    // Draw requester location pin
    const x = toX(centerLon);
    const y = toY(centerLat);

    // Pin shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Pin body (teardrop shape)
    ctx.beginPath();
    ctx.moveTo(x, y - 25);
    ctx.bezierCurveTo(x - 15, y - 25, x - 18, y - 5, x, y + 15);
    ctx.bezierCurveTo(x + 18, y - 5, x + 15, y - 25, x, y - 25);
    ctx.closePath();
    
    const pinGradient = ctx.createLinearGradient(x, y - 25, x, y + 15);
    pinGradient.addColorStop(0, '#F43F5E');
    pinGradient.addColorStop(1, '#BE123C');
    ctx.fillStyle = pinGradient;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pin center dot
    ctx.beginPath();
    ctx.arc(x, y - 12, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Location accuracy ring
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [dimensions, requesterLocation, requesterGeohash]);

  const timeAgo = requestTime ? 
    Math.floor((Date.now() - new Date(requestTime).getTime()) / 60000) : 0;

  return (
    <div className="glass-card overflow-hidden" style={{ border: '1px solid rgba(244, 63, 94, 0.3)' }}>
      {/* Header */}
      <div 
        className="px-3 py-2 d-flex align-items-center justify-content-between"
        style={{ 
          background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.05))',
          borderBottom: '1px solid rgba(244, 63, 94, 0.2)'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <Navigation size={14} color="#F43F5E" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8125rem' }}>
            Request Location
          </span>
        </div>
        {timeAgo > 0 && (
          <div className="d-flex align-items-center gap-1">
            <Clock size={12} color="var(--slate-500)" />
            <span style={{ color: 'var(--slate-400)', fontSize: '0.6875rem' }}>
              {timeAgo}m ago
            </span>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div style={{ position: 'relative', height: '240px' }}>
        <canvas 
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        />
        
        {/* Legend overlay */}
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
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2">
              <div 
                style={{ 
                  width: '0', 
                  height: '0', 
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '8px solid #F43F5E'
                }} 
              />
              <span style={{ color: 'var(--slate-300)', fontSize: '0.6875rem' }}>Requester Area</span>
            </div>
            <small style={{ color: 'var(--slate-500)', fontSize: '0.625rem' }}>
              Geohash: {requesterGeohash?.slice(0, 4)}...
            </small>
          </div>
        </div>

        {/* Navigation hint */}
        <div 
          className="position-absolute d-none d-sm-block"
          style={{ 
            top: '12px', 
            right: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span style={{ color: '#06B6D4', fontSize: '0.6875rem', fontWeight: 500 }}>
            Navigate to this area
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div 
        className="px-3 py-2 d-flex align-items-center justify-content-between"
        style={{ 
          background: 'rgba(15, 23, 42, 0.5)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <MapPin size={12} color="var(--slate-500)" />
          <span style={{ color: 'var(--slate-400)', fontSize: '0.6875rem' }}>
            Exact location shared upon arrival
          </span>
        </div>
        <span style={{ color: 'var(--slate-500)', fontSize: '0.625rem' }}>
          ~500m radius
        </span>
      </div>
    </div>
  );
}
