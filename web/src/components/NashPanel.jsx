import { useGameStore } from '../store/gameStore';
import { Target, Maximize2 } from 'lucide-react';

export default function NashPanel() {
  const attackerStrategies = useGameStore(state => state.attackerStrategies);
  const defenderStrategies = useGameStore(state => state.defenderStrategies);
  const attValue = useGameStore(state => state.attValue);
  const defValue = useGameStore(state => state.defValue);
  const paretoOptima = useGameStore(state => state.paretoOptima);

  return (
    <div className="right-sidebar">
      <div className="panel nash-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Target size={14} />
            <span>EQUILIBRIUM ANALYSIS</span>
          </div>
        </div>

        <div className="panel-content">
          <div style={{ border: '1px solid var(--accent-amber)', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255, 214, 10, 0.05)' }}>
            <h4 className="text-amber" style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>NASH EQUILIBRIUM</h4>
            <span style={{ background: 'var(--accent-amber)', color: '#000', padding: '2px 6px', borderRadius: '2px', fontSize: '0.6rem', fontWeight: 'bold' }}>MIXED STRATEGY</span>
            
            <div style={{ marginTop: '1rem' }}>
              <div className="text-xs text-secondary" style={{ marginBottom: '0.5rem' }}>Attacker probabilities</div>
              {attackerStrategies.map((strat, idx) => (
                <div key={`a-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="font-mono text-xs text-muted" style={{ width: '20px' }}>A{idx + 1}</span>
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${strat.prob}%`, height: '100%', background: 'var(--accent-red)' }}></div>
                  </div>
                  <span className="font-mono text-xs text-secondary" style={{ width: '25px', textAlign: 'right' }}>{strat.prob}%</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="text-xs text-secondary" style={{ marginBottom: '0.5rem' }}>Defender probabilities</div>
              {defenderStrategies.map((strat, idx) => (
                <div key={`d-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="font-mono text-xs text-muted" style={{ width: '20px' }}>D{idx + 1}</span>
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${strat.prob}%`, height: '100%', background: 'var(--accent-cyan)' }}></div>
                  </div>
                  <span className="font-mono text-xs text-secondary" style={{ width: '25px', textAlign: 'right' }}>{strat.prob}%</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div className="text-red font-mono" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{attValue}</div>
                <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>ATT. VALUE</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-cyan font-mono" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{defValue}</div>
                <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>DEF. VALUE</div>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid var(--accent-green)', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(0, 255, 102, 0.05)' }}>
            <h4 className="text-green" style={{ margin: '0 0 1rem 0', fontSize: '0.8rem' }}>PARETO OPTIMA</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {paretoOptima.map(po => (
                <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span className="font-mono text-secondary">{po.strat}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="text-red font-mono">{po.att}</span>
                    <span className="text-muted">/</span>
                    <span className="text-cyan font-mono">{po.def}</span>
                  </div>
                  <div style={{ border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '1px 4px', borderRadius: '2px', fontSize: '0.6rem' }}>PARETO</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Maximize2 size={12} className="text-secondary" />
              <h4 className="text-secondary" style={{ margin: 0, fontSize: '0.8rem' }}>LP CENTRALIZED OPT.</h4>
            </div>
            <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Optimal defense strategy (LP)</div>
            <div className="font-mono text-sm" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', color: '#e2e8f0', marginBottom: '0.5rem' }}>
              max Σ u_d(s_a, s_d)
            </div>
            <div className="text-xs text-secondary">
              Best response: <span className="text-cyan">D3 (37.5%) + D1 (31%)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
