import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export default function SplashScreen({ onComplete }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState('entering'); // entering, loading, exiting
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Orchestrate phases
    const p1 = setTimeout(() => setPhase('loading'), 1000);
    const p2 = setTimeout(() => setPhase('exiting'), 4000);
    const p3 = setTimeout(() => { if (onComplete) onComplete(); }, 5000);

    // Progress animation
    let start = Date.now() + 1000; // Start after 'entering' phase
    const duration = 2500;
    const animateProgress = () => {
      const elapsed = Date.now() - start;
      if (elapsed > 0) {
        const rawProgress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - rawProgress, 4); // Quartic ease out
        setProgress(eased * 100);
      }
      if (elapsed < duration) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);

    return () => { clearTimeout(p1); clearTimeout(p2); clearTimeout(p3); };
  }, [onComplete]);

  // Generate 30 random particles
  const particles = React.useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 4}s`,
      size: `${1 + Math.random() * 3}px`
    }))
  , []);

  const isExiting = phase === 'exiting';

  return (
    <div className={`splash-container ${isExiting ? 'fade-out' : ''}`}>
      
      {/* 3D Infinite Cyber Grid */}
      <div className="cyber-grid-wrapper">
        <div className="cyber-grid"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size, height: p.size
          }}></div>
        ))}
      </div>

      {/* Ambient Deep Glows */}
      <div className="ambient-glow glow-cyan"></div>
      <div className="ambient-glow glow-green"></div>

      <div className="content-wrapper">
        
        {/* Advanced HUD Ring System */}
        <div className={`hud-system ${phase !== 'entering' ? 'hud-active' : ''}`}>
          
          {/* Ring 1 - Outer Hexagon */}
          <div className="hud-ring ring-1">
            <svg viewBox="0 0 100 100">
              <polygon points="50 2, 91 25, 91 75, 50 98, 9 75, 9 25" fill="none" stroke="rgba(0,240,255,0.15)" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Ring 2 - Dashed Tracker */}
          <div className="hud-ring ring-2">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--accent-cyan)" strokeWidth="0.8" strokeDasharray="4 6" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,255,102,0.4)" strokeWidth="2" strokeDasharray="20 180" strokeLinecap="round" />
            </svg>
          </div>

          {/* Ring 3 - Counter Rotating */}
          <div className="hud-ring ring-3">
            <svg viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,214,10,0.3)" strokeWidth="1" strokeDasharray="50 50" />
            </svg>
          </div>

          {/* Logo Core */}
          <div className="logo-core">
            <div className="logo-glass">
              <img src="/logo.png" alt="CyberGameGT" className="logo-img" />
              <div className="logo-scanline"></div>
            </div>
          </div>
        </div>

        {/* Cinematic Text Reveal */}
        <div className="text-section">
          <div className="title-mask">
            <h1 className={`cinematic-title ${phase !== 'entering' ? 'title-revealed' : ''}`}>
              CyberGame<span className="title-highlight">GT</span>
            </h1>
          </div>
          <div className="tagline-mask">
            <p className={`cinematic-tagline ${phase !== 'entering' ? 'tagline-revealed' : ''}`}>
              {t('app.tagline')}
            </p>
          </div>
        </div>

        {/* Tactical Segmented Loader */}
        <div className={`loader-section ${phase !== 'entering' ? 'loader-visible' : ''}`}>
           <div className="loader-data-row">
             <span className="loader-hex">SYS_AUTH_0x{(progress * 255 / 100).toString(16).substring(0,2).toUpperCase()}</span>
             <span className="loader-pct">{progress.toFixed(1)}%</span>
           </div>
           <div className="loader-track">
             {/* 20 segments */}
             {Array.from({length: 20}).map((_, i) => (
               <div key={i} className="loader-segment" style={{
                 background: progress > (i * 5) ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                 boxShadow: progress > (i * 5) ? '0 0 8px var(--accent-cyan)' : 'none'
               }}></div>
             ))}
           </div>
        </div>

      </div>

      <style>{`
        .splash-container {
          position: fixed;
          inset: 0;
          background: #010308;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 1s cubic-bezier(0.8, 0, 0.2, 1);
        }
        .splash-container.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        /* Ambient Glows */
        .ambient-glow {
          position: absolute;
          width: 50vw; height: 50vw;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          z-index: 1;
        }
        .glow-cyan { top: -10%; left: -10%; background: var(--accent-cyan); animation: pulse 8s infinite alternate; }
        .glow-green { bottom: -10%; right: -10%; background: var(--accent-green); animation: pulse 10s infinite alternate-reverse; }

        /* 3D Cyber Grid */
        .cyber-grid-wrapper {
          position: absolute;
          inset: 0;
          perspective: 1000px;
          z-index: 2;
          opacity: 0.4;
          mask-image: linear-gradient(to bottom, transparent 0%, black 60%, black 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 60%, black 100%);
        }
        .cyber-grid {
          position: absolute;
          width: 200%; height: 200%;
          bottom: -50%; left: -50%;
          background-image: 
            linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: rotateX(75deg);
          animation: gridMove 5s linear infinite;
        }

        /* Particles */
        .particles-container {
          position: absolute;
          inset: 0;
          z-index: 3;
        }
        .particle {
          position: absolute;
          bottom: -10px;
          background: var(--accent-cyan);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan);
          animation: floatUp linear infinite;
        }

        /* Content Layout */
        .content-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3.5rem;
        }

        /* HUD System */
        .hud-system {
          position: relative;
          width: 280px; height: 280px;
          display: flex; align-items: center; justify-content: center;
          transform: scale(0.8) rotateX(20deg);
          opacity: 0;
          transition: all 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hud-system.hud-active {
          transform: scale(1) rotateX(0deg);
          opacity: 1;
        }

        .hud-ring {
          position: absolute;
          inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .ring-1 { animation: spin 20s linear infinite; }
        .ring-2 { width: 95%; height: 95%; margin: 2.5%; animation: spin 15s linear infinite reverse; }
        .ring-3 { width: 80%; height: 80%; margin: 10%; animation: spin 10s linear infinite; }

        .logo-core {
          width: 130px; height: 130px;
          border-radius: 24px;
          padding: 3px;
          background: linear-gradient(135deg, rgba(0,240,255,0.5), transparent, rgba(0,255,102,0.5));
          box-shadow: 0 0 40px rgba(0,240,255,0.2), inset 0 0 20px rgba(0,240,255,0.1);
          position: relative;
        }
        .logo-glass {
          width: 100%; height: 100%;
          border-radius: 21px;
          background: rgba(1, 3, 8, 0.9);
          backdrop-filter: blur(10px);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .logo-img {
          width: 80%; height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 0 15px rgba(0,240,255,0.4));
        }
        .logo-scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(0,240,255,0.2), transparent);
          height: 10%;
          animation: scan 3s linear infinite;
        }

        /* Typography */
        .text-section {
          text-align: center;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .title-mask, .tagline-mask {
          overflow: hidden;
        }
        .cinematic-title {
          font-family: var(--font-mono);
          font-size: 4rem;
          margin: 0;
          font-weight: 300;
          color: white;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transform: translateY(100%);
          opacity: 0;
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
          text-shadow: 0 0 30px rgba(0,240,255,0.4);
        }
        .title-highlight {
          font-weight: 700;
          color: var(--accent-cyan);
          text-shadow: 0 0 20px var(--accent-cyan);
        }
        .cinematic-tagline {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          margin: 0;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.4em;
          transform: translateY(100%);
          opacity: 0;
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s;
        }
        .title-revealed, .tagline-revealed {
          transform: translateY(0);
          opacity: 1;
        }

        /* Segmented Loader */
        .loader-section {
          width: 320px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s;
        }
        .loader-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .loader-data-row {
          display: flex; justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--accent-cyan);
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
        }
        .loader-track {
          display: flex; gap: 4px;
          height: 6px;
        }
        .loader-segment {
          flex: 1;
          border-radius: 1px;
          transition: background 0.1s, box-shadow 0.1s;
        }

        /* Animations */
        @keyframes gridMove {
          0% { transform: rotateX(75deg) translateY(0); }
          100% { transform: rotateX(75deg) translateY(50px); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.1; }
          100% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
