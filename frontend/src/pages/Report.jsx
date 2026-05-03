import React from 'react';
import Header from '../components/Header';
import { FileText } from 'lucide-react';

export default function Report() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
        <div className="panel h-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <FileText size={48} className="text-green" />
          <h2 className="text-primary font-mono text-xl">Executive Briefing & Reports</h2>
          <p className="text-secondary text-center max-w-lg">
            Export comprehensive game-theoretic analysis and simulated attack outcomes to PDF, CSV, and JSON formats for security auditing.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--accent-green)', borderRadius: '8px', background: 'rgba(0, 255, 102, 0.05)' }}>
            <span className="text-green font-mono text-sm">NO REPORTS GENERATED YET</span>
          </div>
        </div>
      </div>
    </div>
  );
}
