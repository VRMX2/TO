import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Cpu, Zap } from 'lucide-react';

export default function AIMonitor() {
  const threatLevel = useGameStore(state => state.threatLevel);
  const defenseCoverage = useGameStore(state => state.defenseCoverage);
  const aiLogs = useGameStore(state => state.aiLogs);
  const triggerAI = useGameStore(state => state.triggerAI);

  return (
    <div className="panel ai-monitor" style={{ flex: 1, minHeight: '280px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Cpu size={14} />
          <span>AI DEFENSE MONITOR</span>
        </div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)' }}></div>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span className="text-xs text-secondary font-bold">THREAT LEVEL</span>
            <span className="text-amber font-mono text-xs">{threatLevel}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${threatLevel}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-green), var(--accent-amber), var(--accent-red))' }}></div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span className="text-xs text-secondary font-bold">DEFENSE COVERAGE</span>
            <span className="text-green font-mono text-xs">{defenseCoverage}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${defenseCoverage}%`, height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(0,255,102,0.5)' }}></div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
          {aiLogs.map(log => {
            const colorMap = {
              cyan: 'var(--accent-cyan)',
              green: 'var(--accent-green)',
              amber: 'var(--accent-amber)',
              red: 'var(--accent-red)',
              secondary: 'var(--text-secondary)'
            };
            return (
              <div key={log.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span className="font-mono text-muted text-xs" style={{ whiteSpace: 'nowrap' }}>{log.time}</span>
                <span className="text-xs font-mono" style={{ color: colorMap[log.color] }}>{log.text}</span>
              </div>
            );
          })}
        </div>

        <button 
          className="btn btn-cyan" 
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={triggerAI}
        >
          <Zap size={14} fill="currentColor" />
          Trigger AI Adaptation
        </button>
      </div>
    </div>
  );
}
