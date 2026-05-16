import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export default function SplashScreen({ onComplete }) {
  const { t } = useI18n();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Call onComplete after fade out animation completes (3 seconds total)
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#0a0e17', // Match the deep dark theme
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      overflow: 'hidden'
    }}>
      {/* Background Cyberpunk Grid/Glow */}
      <div style={{
        position: 'absolute',
        width: '150%',
        height: '150%',
        background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.05) 0%, transparent 60%)',
        animation: 'pulseGlow 4s infinite alternate',
        zIndex: 0
      }}></div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* Logo Container with Breathing Animation */}
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '24px',
          padding: '6px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.4), rgba(0, 255, 102, 0.4))',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
          animation: 'float 3s ease-in-out infinite',
          position: 'relative'
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '18px', overflow: 'hidden', background: '#0a0e17' }}>
            <img src="/logo.png" alt="CyberGameGT Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Text Section */}
        <div style={{ textAlign: 'center', animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
          <h1 className="font-mono text-primary" style={{ 
            fontSize: '3.5rem', 
            margin: '0 0 0.5rem 0', 
            letterSpacing: '0.12em', 
            textShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
            textTransform: 'uppercase'
          }}>
            CyberGameGT
          </h1>
          <p className="font-mono text-secondary" style={{ 
            fontSize: '1.1rem', 
            margin: 0, 
            letterSpacing: '0.08em',
            color: 'var(--accent-cyan)'
          }}>
            {t('app.tagline')}
          </p>
        </div>

        {/* Futuristic Loader */}
        <div style={{ 
          marginTop: '2rem',
          width: '200px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))',
            boxShadow: '0 0 10px var(--accent-cyan)',
            animation: 'loadingBar 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}></div>
        </div>
        
        {/* Loading Text */}
        <div style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.7rem', 
          color: 'var(--text-muted)', 
          letterSpacing: '0.2em',
          animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
          marginTop: '-1rem'
        }}>
          INITIALIZING SECURE ENVIRONMENT...
        </div>

      </div>

      {/* Embedded Styles for Animations */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadingBar {
          0% { width: 0%; }
          40% { width: 60%; }
          80% { width: 85%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
