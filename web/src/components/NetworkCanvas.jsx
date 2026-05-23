import { useState, useRef, useCallback } from 'react';

const LOAD_COLORS = ['#00ff66', '#ffd60a', '#ff6b35', '#ff3b30'];

const NODE_TYPES = ['endpoint', 'server', 'firewall', 'core'];
const TYPE_COLORS = { endpoint: 'var(--text-secondary)', server: 'var(--text-secondary)', firewall: 'var(--accent-green)', core: 'var(--accent-cyan)' };

let nodeCounter = 100;

export default function NetworkCanvas({
  nodes: externalNodes,
  links: externalLinks,
  onNodeClick,
  nashNodes,
}) {
  const [internalNodes, setInternalNodes] = useState(null);
  const [internalLinks, setInternalLinks] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const nodes = internalNodes || externalNodes || [];
  const links = internalLinks || externalLinks || [];

  const addNode = () => {
    nodeCounter++;
    const id = `N${nodeCounter}`;
    const type = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)];
    const newNode = {
      id, label: id, type,
      load: Math.random(), payoff: (Math.random() - 0.5) * 10,
      strategy: ['Aggressive', 'Normal', 'Conservative', 'Backup'][Math.floor(Math.random() * 4)],
      fx: 150 + Math.random() * 200, fy: 80 + Math.random() * 200,
      color: TYPE_COLORS[type],
    };
    setInternalNodes([...nodes, newNode]);
    // connect to a random existing node
    if (nodes.length > 0) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      setInternalLinks([...links, { source: newNode.id, target: target.id, bandwidth: 100 + Math.floor(Math.random() * 400), cost: 1 + Math.floor(Math.random() * 4), latency: 2 + Math.floor(Math.random() * 10) }]);
    }
  };

  const removeSelected = () => {
    if (!selectedNode || nodes.length <= 2) return;
    setInternalNodes(nodes.filter(n => n.id !== selectedNode.id));
    setInternalLinks(links.filter(l => l.source.id !== selectedNode.id && l.target.id !== selectedNode.id));
    setSelectedNode(null);
    setTooltip(null);
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(4, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target !== containerRef.current?.querySelector('.graph-layer')) return;
    const startX = e.clientX - pan.x;
    const startY = e.clientY - pan.y;
    const onMove = (ev) => {
      setPan({ x: ev.clientX - startX, y: ev.clientY - startY });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [pan]);

  const handleNodeClick = (e, node) => {
    e.stopPropagation();
    setSelectedNode(node);
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node });
    if (onNodeClick) onNodeClick(node);
  };

  const handleBgClick = () => setTooltip(null);

  const nodeById = {};
  nodes.forEach(n => { nodeById[n.id] = n; });

  // update node payloads from nash
  if (nashNodes?.length > 0) {
    nodes.forEach(n => {
      if (nashNodes.includes(n.id)) n.payoff = Math.max(n.payoff || 0, 2);
    });
  }

  const size = 40;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={addNode} style={tb} title="Add node">+ Node</button>
        <button onClick={removeSelected} disabled={!selectedNode || nodes.length <= 2} style={tb} title="Remove selected">− Node</button>
        <button onClick={() => setZoom(1)} style={tb}>Reset zoom</button>
        <span className="font-mono text-muted" style={{ fontSize: '0.5rem', alignSelf: 'center' }}>{nodes.length}N · {links.length}E</span>
      </div>

      {/* Canvas */}
      <div ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClick={handleBgClick}
        style={{ flex: 1, minHeight: 260, position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,240,255,0.1)', cursor: 'grab', background: 'rgba(0,0,0,0.2)' }}
      >
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <g className="graph-layer" transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Links */}
            {links.map((l, i) => {
              const src = typeof l.source === 'object' ? l.source : nodeById[l.source];
              const tgt = typeof l.target === 'object' ? l.target : nodeById[l.target];
              if (!src || !tgt) return null;
              return (
                <g key={`link-${i}`}>
                  <line x1={src.fx} y1={src.fy} x2={tgt.fx} y2={tgt.fy}
                    stroke="rgba(0,240,255,0.15)" strokeWidth={Math.max(1, (l.bandwidth || 100) / 40)} opacity={0.7} />
                  <text x={(src.fx + tgt.fx) / 2} y={(src.fy + tgt.fy) / 2 - 6}
                    textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-mono)">
                    {l.bandwidth}M · {l.latency}ms
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const isNash = nashNodes?.includes(n.id);
              const lc = LOAD_COLORS[Math.floor((n.load || 0) * LOAD_COLORS.length)];
              const fill = isNash ? 'var(--accent-amber)' : (n.color || lc);
              const r = n.type === 'core' ? 10 : 7;
              const outerR = n.type === 'core' ? 24 : 18;
              return (
                <g key={n.id} onClick={(e) => handleNodeClick(e, n)} style={{ cursor: 'pointer' }}>
                  {isNash && <circle cx={n.fx} cy={n.fy} r={outerR} fill="none" stroke="var(--accent-amber)" strokeWidth={2} strokeDasharray="4 2" opacity={1} />}
                  <circle cx={n.fx} cy={n.fy} r={outerR} fill="transparent"
                    stroke={isNash ? 'var(--accent-amber)' : lc} strokeWidth={isNash ? 3 : 1} opacity={0.4} />
                  <circle cx={n.fx} cy={n.fy} r={r} fill={fill} />
                  <text x={n.fx} y={n.fy + (n.type === 'core' ? 32 : 26)} textAnchor="middle"
                    fill="var(--text-secondary)" fontSize={9} fontFamily="var(--font-mono)">
                    {n.label || n.id}
                  </text>
                  <text x={n.fx} y={n.fy + (n.type === 'core' ? 42 : 36)} textAnchor="middle"
                    fill={(n.payoff || 0) >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)'}
                    fontSize={8} fontFamily="var(--font-mono)" opacity={0.8}>
                    {n.payoff > 0 ? `+${n.payoff.toFixed(1)}` : (n.payoff || 0).toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', left: Math.min(tooltip.x + 12, 260), top: Math.min(tooltip.y - 12, 180),
            background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 8,
            padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', zIndex: 50,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)', pointerEvents: 'none',
          }}>
            <div style={{ color: 'var(--accent-cyan)', marginBottom: 4, fontWeight: 600 }}>{tooltip.node.label || tooltip.node.id}</div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div>Type: {tooltip.node.type}</div>
              <div>Strategy: <span style={{ color: 'var(--accent-amber)' }}>{tooltip.node.strategy || '—'}</span></div>
              <div>Payoff: <span style={{ color: (tooltip.node.payoff || 0) >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>{(tooltip.node.payoff || 0).toFixed(2)}</span></div>
              <div>Load: <span style={{ color: LOAD_COLORS[Math.floor((tooltip.node.load || 0) * LOAD_COLORS.length)] }}>{(tooltip.node.load * 100).toFixed(0)}%</span></div>
              {nashNodes?.includes(tooltip.node.id) && <div style={{ color: 'var(--accent-amber)', marginTop: 2 }}>★ Nash Equilibrium</div>}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.5rem', fontFamily: 'var(--font-mono)' }}>
        {[['#00ff66', 'Low load'], ['#ffd60a', 'Med load'], ['#ff6b35', 'High load'], ['#ff3b30', 'Critical'], ['var(--accent-amber)', 'Nash eq.']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

const tb = {
  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.5rem',
  fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 3,
  background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)',
  color: 'var(--accent-cyan)',
};
