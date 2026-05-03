import React from 'react';
import Header from '../components/Header';
import { Zap } from 'lucide-react';

export default function Simulation() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
        <div className="panel h-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Zap size={48} className="text-red" />
          <h2 className="text-primary font-mono text-xl">Advanced Threat Simulation</h2>
          <p className="text-secondary text-center max-w-lg">
            Configure detailed zero-day exploits, DDoS flooding parameters, and APT multi-stage attack vectors against specific network topologies.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--accent-red)', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.05)' }}>
            <span className="text-red font-mono text-sm">MODULE OFFLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
