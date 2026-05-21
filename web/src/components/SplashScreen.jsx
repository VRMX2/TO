import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export default function SplashScreen({ onComplete }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState('entering');
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [statusLine, setStatusLine] = useState('INITIALIZING CORE...');

  const statusMessages = [
    'INITIALIZING CORE...',
    'LOADING NASH ENGINE...',
    'CALIBRATING THREAT MATRIX...',
    'SYNCHRONIZING AI AGENTS...',
    'SYSTEM READY',
  ];

  useEffect(() => {
    const p1 = setTimeout(() => setPhase('loading'), 800);
    const p2 = setTimeout(() => setPhase('exiting'), 4200);
    const p3 = setTimeout(() => { if (onComplete) onComplete(); }, 5200);

    // Animate progress bar
    let start = null;
    const duration = 2800;
    const startDelay = 900;
    const raf = { id: null };
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start - startDelay;
      if (elapsed > 0) {
        const raw = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        setProgress(eased * 100);
      }
      if (elapsed < duration + startDelay) raf.id = requestAnimationFrame(animate);
    };
    raf.id = requestAnimationFrame(animate);

    // Status message cycling
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, statusMessages.length - 1);
      setStatusLine(statusMessages[msgIdx]);
    }, 700);

    return () => {
      clearTimeout(p1); clearTimeout(p2); clearTimeout(p3);
      cancelAnimationFrame(raf.id);
      clearInterval(msgInterval);
    };
  }, [onComplete]);

  // Typing effect for tagline
  useEffect(() => {
    if (phase === 'entering') return;
    const tag = t('app.tagline') || 'GAME THEORY · CYBERSECURITY · AI';
    let i = 0;
    const timer = setInterval(() => {
      setTypedText(tag.slice(0, i + 1));
      i++;
      if (i >= tag.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [phase, t]);

  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const r1 = seed / 233280;
      const r2 = ((seed * 7) % 233280) / 233280;
      const r3 = ((seed * 13) % 233280) / 233280;
      const r4 = ((seed * 19) % 233280) / 233280;
      return {
        id: i,
        left: `${r1 * 100}%`,
        delay: `${r2 * 5}s`,
        duration: `${4 + r3 * 6}s`,
        size: `${1 + r4 * 2.5}px`,
        color: i % 3 === 0 ? 'rgba(0,255,136,0.7)' : i % 3 === 1 ? 'rgba(168,85,247,0.7)' : 'rgba(0,240,255,0.7)',
      };
    })
  );

  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 300);
    return () => clearInterval(id);
  }, []);

  const [clockSec] = useState(() => (performance.now() / 1000).toFixed(2));

  const isExiting = phase === 'exiting';
  const isActive = phase !== 'entering';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(0,10,30,1) 0%, #010308 60%)',
      overflow: 'hidden',
      opacity: isExiting ? 0 : 1,
      transition: 'opacity 1.2s cubic-bezier(0.8, 0, 0.2, 1)',
    }}>

      {/* === BACKGROUND GRID === */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* === 3D PERSPECTIVE GRID === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
        perspective: '600px', zIndex: 2, overflow: 'hidden',
        maskImage: 'linear-gradient(to top, rgba(0,240,255,0.15) 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,240,255,0.15) 0%, transparent 100%)',
      }}>
        <div style={{
          position: 'absolute', width: '300%', height: '300%',
          left: '-100%', top: 0,
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.18) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'rotateX(80deg)',
          transformOrigin: 'center top',
          animation: 'gridScroll 4s linear infinite',
        }} />
      </div>

      {/* === AMBIENT GLOWS === */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: '55vw', height: '55vw', borderRadius: '50%',
          top: '-15%', left: '-10%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.18) 0%, transparent 65%)',
          animation: 'breathe 8s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', width: '50vw', height: '50vw', borderRadius: '50%',
          bottom: '-15%', right: '-10%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)',
          animation: 'breathe 11s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%',
          top: '20%', right: '5%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 65%)',
          animation: 'breathe 14s ease-in-out infinite alternate',
        }} />
      </div>

      {/* === FLOATING PARTICLES === */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', bottom: '-5px',
            left: p.left, width: p.size, height: p.size,
            borderRadius: '50%', background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animationName: 'floatParticle',
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }} />
        ))}
      </div>

      {/* === MAIN CONTENT === */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '2.5rem',
      }}>

        {/* === HUD RING SYSTEM === */}
        <div style={{
          position: 'relative', width: 300, height: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scale(1) rotateX(0deg)' : 'scale(0.7) rotateX(25deg)',
          transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Outermost dashed ring */}
          <div style={{ position: 'absolute', inset: 0, animation: 'rotateCW 25s linear infinite' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,240,255,0.15)" strokeWidth="0.4" strokeDasharray="2 4" />
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,240,255,0.5)" strokeWidth="0.8" strokeDasharray="8 92" strokeLinecap="round" />
            </svg>
          </div>

          {/* Hexagon ring */}
          <div style={{ position: 'absolute', inset: '5%', animation: 'rotateCCW 18s linear infinite' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <polygon points="50 3, 93 26, 93 74, 50 97, 7 74, 7 26"
                fill="none" stroke="rgba(0,255,136,0.25)" strokeWidth="0.6" strokeDasharray="3 5" />
              <polygon points="50 3, 93 26, 93 74, 50 97, 7 74, 7 26"
                fill="none" stroke="rgba(0,255,136,0.7)" strokeWidth="1" strokeDasharray="15 141" strokeLinecap="round" />
            </svg>
          </div>

          {/* Inner amber tracker ring */}
          <div style={{ position: 'absolute', inset: '15%', animation: 'rotateCW 12s linear infinite' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,214,10,0.2)" strokeWidth="0.8" />
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,214,10,0.8)" strokeWidth="1.5" strokeDasharray="25 75" strokeLinecap="round" />
            </svg>
          </div>

          {/* Purple inner ring */}
          <div style={{ position: 'absolute', inset: '24%', animation: 'rotateCCW 8s linear infinite' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.6" strokeDasharray="6 8" />
            </svg>
          </div>

          {/* === GLASS LOGO CORE === */}
          <div style={{
            width: 130, height: 130, borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(0,240,255,0.4) 0%, rgba(0,0,0,0) 50%, rgba(168,85,247,0.4) 100%)',
            padding: 2, position: 'relative',
            boxShadow: '0 0 60px rgba(0,240,255,0.2), 0 0 100px rgba(168,85,247,0.1)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: 26,
              background: 'rgba(1, 5, 16, 0.92)',
              backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              {/* Logo image */}
              <img src="/logo.png" alt="CyberGameGT"
                style={{ width: '72%', height: '72%', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(0,240,255,0.6))' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* Fallback hex icon if no logo */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '2.5rem', color: 'rgba(0,240,255,0.9)',
                textShadow: '0 0 20px rgba(0,240,255,0.8)',
              }}>⬡</div>
              {/* Scanline sweep */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,240,255,0.25) 50%, transparent 100%)',
                height: '30%', animation: 'scanSweep 2.5s linear infinite',
              }} />
              {/* Corner accents */}
              {[['0px','0px','10px 0 0 0'], ['0px','auto','0 10px 0 0'], ['auto','0px','0 0 0 10px'], ['auto','auto','0 0 10px 0']].map(([t2,l2,r2],idx) => (
                <div key={idx} style={{
                  position: 'absolute', top: t2 === 'auto' ? 'auto' : 0, left: l2 === 'auto' ? 'auto' : 0,
                  right: l2 === 'auto' ? 0 : 'auto', bottom: t2 === 'auto' ? 0 : 'auto',
                  width: 14, height: 14,
                  border: '1.5px solid rgba(0,240,255,0.6)',
                  borderRadius: r2,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>

          {/* Corner tick marks on outer ring */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div key={deg} style={{
              position: 'absolute', width: '100%', height: '100%',
              transform: `rotate(${deg}deg)`,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                width: 2, height: 8, background: 'rgba(0,240,255,0.5)',
                borderRadius: 1,
              }} />
            </div>
          ))}
        </div>

        {/* === TYPOGRAPHY === */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{
              fontFamily: 'var(--font-mono)', fontSize: '3.8rem', margin: 0,
              fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#f8fafc',
              textShadow: '0 0 40px rgba(0,240,255,0.3)',
              transform: isActive ? 'translateY(0)' : 'translateY(110%)',
              opacity: isActive ? 1 : 0,
              transition: 'all 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
            }}>
              Cyber<span style={{ color: 'var(--accent-cyan)', fontWeight: 700, textShadow: '0 0 30px rgba(0,240,255,0.8), 0 0 60px rgba(0,240,255,0.3)' }}>Game</span>
              <span style={{ color: 'rgba(168,85,247,0.95)', fontWeight: 700, textShadow: '0 0 30px rgba(168,85,247,0.8)' }}>GT</span>
            </h1>
          </div>

          {/* Subtitle with typing effect */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.45em',
            textTransform: 'uppercase', minHeight: '1.2em',
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.8s ease 0.6s',
          }}>
            {typedText}
            <span style={{ opacity: cursorOn ? 1 : 0, color: 'var(--accent-cyan)' }}>|</span>
          </div>

          {/* Version / Classification badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.8s ease 0.9s',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em',
              color: 'rgba(255,214,10,0.7)', background: 'rgba(255,214,10,0.07)',
              border: '1px solid rgba(255,214,10,0.2)', borderRadius: 4,
              padding: '3px 10px',
            }}>v2.2 · PRO</div>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em',
              color: 'rgba(0,255,136,0.7)', background: 'rgba(0,255,136,0.07)',
              border: '1px solid rgba(0,255,136,0.2)', borderRadius: 4,
              padding: '3px 10px',
            }}>SECURE CHANNEL</div>
          </div>
        </div>

        {/* === TACTICAL LOADER === */}
        <div style={{
          width: 380, opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 1s',
        }}>
          {/* Status + percentage row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.6rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent-green)',
                boxShadow: '0 0 8px var(--accent-green)',
                animation: 'blinkDot 1s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                {statusLine}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
              {progress.toFixed(0)}%
            </span>
          </div>

          {/* Segmented bar */}
          <div style={{ display: 'flex', gap: 3, height: 5 }}>
            {Array.from({ length: 24 }).map((_, i) => {
              const filled = progress > (i / 24) * 100;
              const isGreen = i > 18;
              const isPurple = i > 21;
              const color = isPurple ? 'var(--accent-purple)' : isGreen ? 'var(--accent-green)' : 'var(--accent-cyan)';
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 2,
                  background: filled ? color : 'rgba(255,255,255,0.05)',
                  boxShadow: filled ? `0 0 6px ${color}` : 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }} />
              );
            })}
          </div>

          {/* Hex address row */}
          <div style={{
            marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
            color: 'rgba(0,240,255,0.3)', letterSpacing: '0.08em',
          }}>
            <span>MEM:0x{Math.floor(progress * 1048576 / 100).toString(16).toUpperCase().padStart(7, '0')}</span>
            <span>GT-ENGINE · NASH · PARETO · RL</span>
            <span>CLK:{clockSec}s</span>
          </div>
        </div>

      </div>

      {/* === CORNER HUD DECORATIONS === */}
      {[
        { top: 16, left: 16, border: '2px solid rgba(0,240,255,0.25) transparent transparent rgba(0,240,255,0.25)', r: '6px 0 0 0' },
        { top: 16, right: 16, border: '2px solid rgba(0,240,255,0.25) rgba(0,240,255,0.25) transparent transparent', r: '0 6px 0 0' },
        { bottom: 16, left: 16, border: 'transparent transparent rgba(0,240,255,0.25) rgba(0,240,255,0.25)', r: '0 0 0 6px' },
        { bottom: 16, right: 16, border: 'transparent rgba(0,240,255,0.25) rgba(0,240,255,0.25) transparent', r: '0 0 6px 0' },
      ].map((c, idx) => (
        <div key={idx} style={{
          position: 'absolute', width: 40, height: 40, zIndex: 20,
          top: c.top, bottom: c.bottom, left: c.left, right: c.right,
          borderWidth: 2, borderStyle: 'solid', borderColor: c.border.replace(/transparent/g,'transparent'),
          borderRadius: c.r,
          borderTopColor: c.border.split(' ')[0],
          borderRightColor: c.border.split(' ')[1],
          borderBottomColor: c.border.split(' ')[2],
          borderLeftColor: c.border.split(' ')[3],
          opacity: isActive ? 0.6 : 0,
          transition: 'opacity 1s ease 1.2s',
        }} />
      ))}

      <style>{`
        @keyframes rotateCW { 100% { transform: rotate(360deg); } }
        @keyframes rotateCCW { 100% { transform: rotate(-360deg); } }
        @keyframes scanSweep {
          0% { transform: translateY(-200%); }
          100% { transform: translateY(500%); }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-100vh) scale(0.2); opacity: 0; }
        }
        @keyframes breathe {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes gridScroll {
          0% { backgroundPositionY: 0px; }
          100% { backgroundPositionY: 60px; }
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--accent-green); }
          50% { opacity: 0.4; box-shadow: 0 0 3px var(--accent-green); }
        }
      `}</style>
    </div>
  );
}
