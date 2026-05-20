import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Simulation from './pages/Simulation';
import Report from './pages/Report';
import About from './pages/About';
import SplashScreen from './components/SplashScreen';
import './styles/globals.css';
import './styles/dashboard.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease-in', visibility: showSplash ? 'hidden' : 'visible' }}>
        <div style={{ flex: 1 }}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/simulate" element={<Simulation />} />
            <Route path="/report" element={<Report />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Router>
      </div>
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 1.5rem',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(2, 6, 23, 0.85))',
        borderTop: '1px solid rgba(0, 240, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.58rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle top-edge glow */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,240,255,0.2) 50%, transparent 100%)' }} />

        {/* Left: status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {[
            { label: 'NASH ENGINE', color: 'var(--accent-green)' },
            { label: 'WEBSOCKET', color: 'var(--accent-cyan)' },
            { label: 'DATABASE', color: 'var(--accent-amber)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Center: copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>CyberGameGT</span>
          <span style={{ color: 'rgba(0,240,255,0.4)' }}>·</span>
          <span>&copy; 2026</span>
          <span style={{ color: 'rgba(0,240,255,0.4)' }}>·</span>
          <span>Techniques d'Optimisation</span>
        </div>

        {/* Right: version badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '2px 10px',
          background: 'rgba(168,85,247,0.06)',
          border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 12,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-purple)', boxShadow: '0 0 4px var(--accent-purple)' }} />
          <span style={{ color: 'rgba(168,85,247,0.8)' }}>v2.0 ACADEMIC</span>
        </div>
      </footer>
    </div>
    </>
  );
}

export default App;
