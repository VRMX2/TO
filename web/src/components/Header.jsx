import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Activity, Hexagon } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function Header() {
  const nashEngineActive = useGameStore((state) => state.nashEngineActive);
  const threatLevel = useGameStore((state) => state.threatLevel);
  const location = useLocation();

  const tabs = [
    { name: 'Dashboard', path: '/' },
    { name: 'Analysis', path: '/analysis' },
    { name: 'Simulate', path: '/simulate' },
    { name: 'Report', path: '/report' }
  ];

  return (
    <header className="header-container scanline-effect">
      <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <Hexagon className="text-cyan" size={24} />
        </div>
        <div>
          <h1 className="text-primary m-0" style={{ fontSize: '1.25rem', margin: 0 }}>CyberGameGT</h1>
          <p className="text-xs text-secondary m-0" style={{ letterSpacing: '0.1em', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            AI-DRIVEN GAME THEORETIC ADAPTIVE DEFENSE
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          border: '1px solid var(--accent-green)', borderRadius: '20px', 
          padding: '0.25rem 1rem', background: 'rgba(0, 255, 102, 0.05)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)' }}></div>
          <span className="text-xs font-mono text-green">NASH ENGINE ACTIVE</span>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          border: '1px solid var(--accent-amber)', borderRadius: '20px', 
          padding: '0.25rem 1rem', background: 'rgba(255, 214, 10, 0.05)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 5px var(--accent-amber)' }}></div>
          <span className="text-xs font-mono text-amber">THREAT LEVEL: {threatLevel > 60 ? 'HIGH' : threatLevel > 30 ? 'MEDIUM' : 'LOW'}</span>
        </div>

        <nav style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link key={tab.name} to={tab.path} style={{
                background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                textDecoration: 'none'
              }}>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
