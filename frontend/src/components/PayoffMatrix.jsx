import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Grid } from 'lucide-react';

export default function PayoffMatrix() {
  const matrix = useGameStore(state => state.payoffMatrix);
  const nashCell = useGameStore(state => state.nashEquilibriumCell);

  return (
    <div className="panel payoff-matrix h-full" style={{ minWidth: '280px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Grid size={14} />
          <span>PAYOFF MATRIX</span>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>
          4x4
        </div>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(4, 1fr)', gap: '4px', width: '100%' }}>
          {/* Header Row */}
          <div></div>
          {['D1', 'D2', 'D3', 'D4'].map(d => (
            <div key={d} className="text-cyan font-mono text-xs" style={{ textAlign: 'center', padding: '0.5rem 0' }}>{d}</div>
          ))}

          {/* Matrix Rows */}
          {matrix.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              <div className="text-red font-mono text-xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                A{rIdx + 1}
              </div>
              {row.map((val, cIdx) => {
                const isNash = nashCell.row === rIdx && nashCell.col === cIdx;
                const isGain = val > 0;
                const colorClass = isGain ? 'text-cyan' : val < 0 ? 'text-red' : 'text-primary';
                const bgStyle = isGain ? 'rgba(0, 240, 255, 0.05)' : val < 0 ? 'rgba(255, 59, 48, 0.05)' : 'rgba(255,255,255,0.02)';
                
                return (
                  <div key={`${rIdx}-${cIdx}`} style={{
                    background: bgStyle,
                    border: isNash ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                    boxShadow: isNash ? '0 0 10px var(--accent-amber-glow)' : 'none',
                    borderRadius: '4px',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: isNash ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} className={`${colorClass} font-mono`}
                  onMouseEnter={(e) => { if(!isNash) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { if(!isNash) e.currentTarget.style.background = bgStyle; }}
                  >
                    {val}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.7rem' }} className="font-mono text-secondary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)' }}></div> Att. gain
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent-red)' }}></div> Att. loss
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '8px', height: '8px', border: '1px solid var(--accent-amber)' }}></div> Nash eq.
          </div>
        </div>
      </div>
    </div>
  );
}
