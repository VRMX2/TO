import { useState, useMemo } from 'react';

function utility(bw, load) { return bw / (1 + load); }

function computeNash(links, numPlayers) {
  let assign = Array(numPlayers).fill(0);
  for (let iter = 0; iter < 50; iter++) {
    const next = [...assign];
    for (let p = 0; p < numPlayers; p++) {
      const loads = links.map((l, i) => ({ ...l, load: next.filter(a => a === i).length - (next[p] === i ? 1 : 0) }));
      let best = 0, bestU = -Infinity;
      loads.forEach((l, i) => { const u = utility(l.capacity, l.load + 1); if (u > bestU) { bestU = u; best = i; } });
      next[p] = best;
    }
    if (next.every((v, i) => v === assign[i])) break;
    assign = next;
  }
  return assign;
}

export default function BandwidthGame() {
  const [flows, setFlows] = useState(5);
  const [links, setLinks] = useState([
    { id: 'L1', label: 'Path A', capacity: 100, latency: 2 },
    { id: 'L2', label: 'Path B', capacity: 80, latency: 3 },
    { id: 'L3', label: 'Path C', capacity: 60, latency: 5 },
    { id: 'L4', label: 'Path D', capacity: 120, latency: 1 },
  ]);

  const assignments = useMemo(() => computeNash(links, flows), [links, flows]);
  const nashLoads = useMemo(() => links.map((l, i) => ({ ...l, load: assignments.filter(a => a === i).length })), [links, assignments]);
  const nashUtils = useMemo(() => nashLoads.map(l => ({ ...l, util: utility(l.capacity, l.load) })), [nashLoads]);
  const totalUtil = useMemo(() => nashUtils.reduce((s, u) => s + u.util, 0), [nashUtils]);

  const updateLink = (idx, field, val) => {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const addPath = () => {
    setLinks(prev => [...prev, { id: `L${prev.length + 1}`, label: `Path ${String.fromCharCode(65 + prev.length)}`, capacity: 50, latency: 5 }]);
  };

  const removePath = (idx) => {
    if (links.length <= 2) return;
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="panel" style={{ marginTop: '1rem' }}>
      <div className="panel-header">
        <div className="panel-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>BANDWIDTH GAME — Nash Equilibrium Allocation</div>
        <span className="font-mono text-muted" style={{ fontSize: '0.55rem' }}>Selfish Routing · {flows} Flows · {links.length} Paths</span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Flows:
          <input type="number" min={2} max={20} value={flows} onChange={e => setFlows(Math.max(2, Math.min(20, parseInt(e.target.value) || 5)))}
            style={inpS} />
        </label>
        <button onClick={addPath} style={btnS}>+ Add Path</button>
        <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--accent-cyan)' }}>
          Social Welfare: <strong>{totalUtil.toFixed(1)}</strong>
        </span>
      </div>

      {/* Paths */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
        {nashUtils.map((link, i) => (
          <div key={link.id} style={{
            padding: '0.5rem', borderRadius: 8,
            border: `1px solid ${link.load > 0 ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
            background: link.load > 0 ? 'rgba(0,240,255,0.04)' : 'transparent',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', width: 60, outline: 'none' }} />
              <button onClick={() => removePath(i)} disabled={links.length <= 2}
                style={{ background: 'none', border: 'none', color: links.length <= 2 ? 'var(--text-muted)' : 'var(--accent-red)', cursor: 'pointer', fontSize: '0.5rem', padding: 0 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem' }}>
              <label className="font-mono" style={{ fontSize: '0.45rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                BW:
                <input type="number" min={10} max={500} value={link.capacity} onChange={e => updateLink(i, 'capacity', Math.max(10, parseInt(e.target.value) || 10))}
                  style={{ ...inpS, width: 40 }} />
              </label>
              <label className="font-mono" style={{ fontSize: '0.45rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                Lat:
                <input type="number" min={1} max={50} value={link.latency} onChange={e => updateLink(i, 'latency', Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ ...inpS, width: 35 }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.25rem', flexWrap: 'wrap', minHeight: 22 }}>
              {assignments.map((a, p) => a === i && (
                <span key={p} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: `var(--accent-${['red','cyan','green','amber','purple','pink','orange','teal'][p % 8]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: '#000',
                }}>{p + 1}</span>
              ))}
              {assignments.filter(a => a === i).length === 0 && (
                <span className="font-mono" style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginRight: '0.4rem', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (link.load / Math.max(1, flows)) * 100)}%`, height: '100%',
                  background: link.load > 2 ? 'var(--accent-red)' : link.load > 1 ? 'var(--accent-amber)' : 'var(--accent-green)',
                  borderRadius: 2,
                }} />
              </div>
              <span className="font-mono" style={{ fontSize: '0.5rem', color: link.util > 20 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                U={link.util.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, padding: '0.35rem 0.6rem', background: 'rgba(255,214,10,0.04)', borderRadius: 6, border: '1px solid rgba(255,214,10,0.12)' }}>
          <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--accent-amber)' }}>
            {(() => {
              const maxUtil = Math.max(...nashUtils.map(u => u.util));
              const minUtil = Math.min(...nashUtils.map(u => u.util));
              const spread = maxUtil - minUtil;
              if (spread < 0.1) return '★ Pure Nash Equilibrium — all paths equally optimal';
              const total = nashUtils.reduce((s, u) => s + u.load, 0);
              if (total === flows && nashUtils.every(u => u.load <= 1 || u.util > 15)) return '≈ Approaching Nash Equilibrium';
              return '◌ Selfish routing equilibrium — flows on best-response paths';
            })()}
          </span>
        </div>
        <div className="font-mono" style={{ fontSize: '0.45rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          U = bandwidth / (1 + load) · colored dots = flows 1–{flows}
        </div>
      </div>
    </div>
  );
}

const inpS = {
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)', padding: '2px 4px', borderRadius: 3,
  fontSize: '0.5rem', fontFamily: 'var(--font-mono)', width: 45, outline: 'none',
};

const btnS = {
  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.5rem',
  fontFamily: 'var(--font-mono)', background: 'rgba(0,240,255,0.06)',
  border: '1px solid rgba(0,240,255,0.15)', color: 'var(--accent-cyan)',
};
