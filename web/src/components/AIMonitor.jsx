import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Cpu, Zap, ShieldAlert, Activity } from 'lucide-react';

export default function AIMonitor() {
  const threatLevel = useGameStore(state => state.threatLevel);
  const defenseCoverage = useGameStore(state => state.defenseCoverage);
  const aiLogs = useGameStore(state => state.aiLogs);
  const triggerAI = useGameStore(state => state.triggerAI);

  const threatColor = threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)';

  return (
    <div className="panel ai-monitor" style={{ flex: 1, minHeight: '280px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Cpu size={13} />
          <span>AI DEFENSE MONITOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--accent-green)', letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>

        {/* Threat Level */}
        <div style={{
          padding: '0.6rem 0.75rem',
          background: `${threatColor}08`,
          border: `1px solid ${threatColor}20`,
          borderLeft: `3px solid ${threatColor}`,
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={11} style={{ color: threatColor }} />
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Threat Level</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: threatColor, fontWeight: 600, textShadow: `0 0 10px ${threatColor}` }}>
              {threatLevel}%
            </span>
          </div>
          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${threatLevel}%`, height: '100%', borderRadius: 4,
              background: `linear-gradient(90deg, ${threatColor}60, ${threatColor})`,
              boxShadow: `0 0 10px ${threatColor}`,
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* Defense Coverage */}
        <div style={{
          padding: '0.6rem 0.75rem',
          background: 'rgba(0,255,136,0.04)',
          border: '1px solid rgba(0,255,136,0.15)',
          borderLeft: '3px solid var(--accent-green)',
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={11} style={{ color: 'var(--accent-green)' }} />
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Defense Coverage</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600, textShadow: '0 0 10px var(--accent-green)' }}>
              {defenseCoverage}%
            </span>
          </div>
          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${defenseCoverage}%`, height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, rgba(0,255,136,0.5), var(--accent-green))',
              boxShadow: '0 0 10px rgba(0,255,136,0.5)',
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* Event Log */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '0.3rem', paddingRight: 2 }}>
          {aiLogs.map(log => {
            const colorMap = {
              cyan: 'var(--accent-cyan)',
              green: 'var(--accent-green)',
              amber: 'var(--accent-amber)',
              red: 'var(--accent-red)',
              secondary: 'var(--text-secondary)'
            };
            const c = colorMap[log.color] || 'var(--text-secondary)';
            return (
              <div key={log.id} style={{
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                padding: '0.3rem 0.5rem',
                borderRadius: 5,
                background: `${c}06`,
                borderLeft: `2px solid ${c}40`,
              }}>
                <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2, flexShrink: 0 }}>{log.time}</span>
                <span className="font-mono text-xs" style={{ color: c, lineHeight: 1.5 }}>{log.text}</span>
              </div>
            );
          })}
        </div>

        {/* AI Trigger Button */}
        <button
          className="btn btn-cyan"
          style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', letterSpacing: '0.1em' }}
          onClick={triggerAI}
        >
          <Zap size={13} fill="currentColor" />
          Trigger AI Adaptation
        </button>
      </div>
    </div>
  );
}
