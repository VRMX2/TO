import React from 'react';
import Header from '../components/Header';
import { Target } from 'lucide-react';

export default function Analysis() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
        <div className="panel h-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Target size={48} className="text-cyan" />
          <h2 className="text-primary font-mono text-xl">Deep Equilibrium Analysis</h2>
          <p className="text-secondary text-center max-w-lg">
            This module provides advanced game-theoretic analysis, subgame perfect equilibrium calculations, and extensive form game trees for multi-stage network attacks.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            <span className="text-amber font-mono text-sm">STATUS: UNDER CONSTRUCTION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
