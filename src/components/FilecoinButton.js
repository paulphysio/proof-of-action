'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Database, 
  Check, 
  Upload, 
  Shield, 
  FileCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * Animated Filecoin Button - Shows cool loading animation during Filecoin operations
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.isLoading - Whether the operation is in progress
 * @param {string} props.loadingText - Text to show during loading
 * @param {string} props.successText - Text to show on success
 * @param {React.ReactNode} props.children - Button content when not loading
 * @param {string} props.variant - 'gradient' | 'gold' | 'outline'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {string} props.className - Additional classes
 * @param {boolean} props.disabled - Whether button is disabled
 */
export default function FilecoinButton({ 
  onClick, 
  isLoading, 
  loadingText = 'Saving to Filecoin...',
  successText = 'Saved!',
  children,
  variant = 'gradient',
  size = 'md',
  className = '',
  disabled = false,
  showSuccess = false
}) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle'); // idle | encrypting | uploading | verifying | success

  // Simulate progress stages during loading
  useEffect(() => {
    if (isLoading) {
      setStage('encrypting');
      setProgress(0);
      
      const stages = [
        { stage: 'encrypting', progress: 20, delay: 300 },
        { stage: 'uploading', progress: 50, delay: 800 },
        { stage: 'verifying', progress: 80, delay: 1500 },
        { stage: 'success', progress: 100, delay: 2200 }
      ];

      const timers = stages.map(({ stage: s, progress: p, delay }) => 
        setTimeout(() => {
          setStage(s);
          setProgress(p);
        }, delay)
      );

      return () => timers.forEach(clearTimeout);
    } else if (showSuccess) {
      setStage('success');
      setProgress(100);
    } else {
      setStage('idle');
      setProgress(0);
    }
  }, [isLoading, showSuccess]);

  const getStageIcon = () => {
    switch (stage) {
      case 'encrypting':
        return <Shield size={18} className="animate-pulse" />;
      case 'uploading':
        return <Upload size={18} className="animate-bounce-subtle" />;
      case 'verifying':
        return <FileCheck size={18} className="animate-pulse" />;
      case 'success':
        return <Check size={18} className="animate-reveal-scale" />;
      default:
        return <Loader2 size={18} className="animate-spin" />;
    }
  };

  const getStageText = () => {
    switch (stage) {
      case 'encrypting':
        return 'Encrypting...';
      case 'uploading':
        return 'Uploading to Filecoin...';
      case 'verifying':
        return 'Verifying on-chain...';
      case 'success':
        return successText;
      default:
        return loadingText;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'encrypting':
        return '#8B5CF6'; // purple
      case 'uploading':
        return '#06B6D4'; // cyan
      case 'verifying':
        return '#F59E0B'; // amber
      case 'success':
        return '#10B981'; // emerald
      default:
        return '#06B6D4';
    }
  };

  const sizeClasses = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem', height: '36px' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.9375rem', height: '44px' },
    lg: { padding: '1rem 2rem', fontSize: '1rem', height: '52px' }
  };

  const variantStyles = {
    gradient: {
      background: isLoading 
        ? `linear-gradient(90deg, ${getStageColor()}20 0%, ${getStageColor()}40 100%)`
        : 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      border: `1px solid ${isLoading ? getStageColor() : 'transparent'}`,
      color: 'white'
    },
    gold: {
      background: isLoading
        ? `linear-gradient(90deg, ${getStageColor()}20 0%, ${getStageColor()}40 100%)`
        : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      border: `1px solid ${isLoading ? getStageColor() : 'transparent'}`,
      color: isLoading ? 'white' : 'var(--navy-950)'
    },
    outline: {
      background: isLoading 
        ? `linear-gradient(90deg, ${getStageColor()}10 0%, ${getStageColor()}20 100%)`
        : 'transparent',
      border: `1px solid ${isLoading ? getStageColor() : 'rgba(255,255,255,0.2)'}`,
      color: 'white'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn w-100 position-relative overflow-hidden ${className}`}
      style={{
        ...variantStyles[variant],
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius-lg)',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: currentSize.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}
    >
      {/* Progress Bar Background */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${getStageColor()}, ${getStageColor()}80)`,
            transition: 'width 0.3s ease',
            zIndex: 1
          }}
        />
      )}

      {/* Animated Background Effect */}
      {isLoading && (
        <div
          className="animate-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${progress}% 50%, ${getStageColor()}20 0%, transparent 50%)`,
            opacity: 0.5,
            zIndex: 0
          }}
        />
      )}

      {/* Success Glow Effect */}
      {stage === 'success' && (
        <div
          className="animate-pulse-glow"
          style={{
            position: 'absolute',
            inset: '-2px',
            background: `linear-gradient(135deg, ${getStageColor()}40, transparent)`,
            borderRadius: 'var(--radius-lg)',
            zIndex: -1,
            filter: 'blur(8px)'
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isLoading ? (
          <>
            <div 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `${getStageColor()}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${getStageColor()}`
              }}
            >
              {getStageIcon()}
            </div>
            <span>{getStageText()}</span>
            {stage === 'success' && <Sparkles size={16} className="animate-bounce-subtle" />}
          </>
        ) : (
          children
        )}
      </div>
    </button>
  );
}

/**
 * Simple loading spinner with text for inline use
 */
export function FilecoinLoadingState({ 
  stage = 'uploading',
  progress = 50,
  compact = false 
}) {
  const stages = {
    encrypting: { icon: Shield, color: '#8B5CF6', text: 'Encrypting data...' },
    uploading: { icon: Upload, color: '#06B6D4', text: 'Uploading to Filecoin...' },
    verifying: { icon: FileCheck, color: '#F59E0B', text: 'Verifying on-chain...' },
    completed: { icon: Check, color: '#10B981', text: 'Complete!' }
  };

  const current = stages[stage] || stages.uploading;
  const Icon = current.icon;

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div 
          className="animate-spin"
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${current.color}30`,
            borderTop: `2px solid ${current.color}`,
            borderRadius: '50%'
          }}
        />
        <span style={{ color: current.color, fontSize: '0.875rem', fontWeight: 500 }}>
          {current.text}
        </span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center gap-3 py-4">
      {/* Animated Icon Circle */}
      <div 
        className="animate-pulse-glow"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${current.color}20, ${current.color}10)`,
          border: `2px solid ${current.color}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Icon size={28} color={current.color} className={stage !== 'completed' ? 'animate-bounce-subtle' : ''} />
        
        {/* Rotating ring */}
        {stage !== 'completed' && (
          <div
            className="animate-spin-slow"
            style={{
              position: 'absolute',
              inset: '-4px',
              border: `2px dashed ${current.color}40`,
              borderRadius: '50%',
              animationDuration: '3s'
            }}
          />
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ width: '200px' }}>
        <div 
          className="d-flex justify-content-between mb-1"
          style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}
        >
          <span style={{ color: current.color, fontWeight: 600 }}>{current.text}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ 
          height: '6px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${current.color}, ${current.color}80)`,
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${current.color}50`
            }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div className="d-flex gap-2 mt-2">
        {Object.keys(stages).map((s, i) => (
          <div
            key={s}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: s === stage 
                ? current.color 
                : i < Object.keys(stages).indexOf(stage) 
                  ? '#10B981' 
                  : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              boxShadow: s === stage ? `0 0 8px ${current.color}` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}
