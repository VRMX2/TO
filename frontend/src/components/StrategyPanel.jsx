import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Layers } from 'lucide-react';

export default function StrategyPanel() {
  const attackerStrategies = useGameStore(state => state.attackerStrategies);
  const defenderStrategies = useGameStore(state => state.defenderStrategies);

  const renderStrategyList = (title, strategies, colorClass, colorVar) => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ width: '3px', height: '16px', background: `var(--${colorVar})` }}></div>
        <h3 className={`text-xs ${colorClass}`} style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {strategies.map((strat, idx) => (
          <div key={strat.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-secondary font-mono text-xs" style={{ width: '12px' }}>{idx + 1}</span>
            <span className="text-primary text-sm" style={{ width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{strat.name}</span>
            
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${strat.prob}%`, height: '100%', background: `var(--${colorVar})`, boxShadow: `0 0 8px var(--${colorVar}-glow)` }}></div>
            </div>
            
            <span className="font-mono text-xs text-secondary" style={{ width: '30px', textAlign: 'right' }}>{strat.prob}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="panel strategy-panel h-full" style={{ minWidth: '280px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Layers size={14} />
          <span>PLAYER STRATEGIES</span>
        </div>
        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
          8 ACTIVE
        </div>
      </div>

      <div className="panel-content" style={{ overflowY: 'auto' }}>
        {renderStrategyList('ATTACKER', attackerStrategies, 'text-red', 'accent-red')}
        {renderStrategyList('DEFENDER', defenderStrategies, 'text-cyan', 'accent-cyan')}
      </div>
    </div>
  );
}
