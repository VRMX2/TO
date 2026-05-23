const TOPOLOGIES = {
  star: {
    nodes: [
      { id:'Core', x:200, y:120, type:'core', label:'Core' },
      { id:'FW', x:280, y:120, type:'firewall', label:'FW' },
      { id:'Web', x:255, y:180, type:'server', label:'Web' },
      { id:'App', x:200, y:210, type:'server', label:'App' },
      { id:'DB', x:145, y:180, type:'server', label:'DB' },
      { id:'EP1', x:120, y:120, type:'endpoint', label:'EP1' },
      { id:'EP2', x:200, y:30, type:'endpoint', label:'EP2' },
    ],
    links: [['Core','FW'],['Core','Web'],['Core','App'],['Core','DB'],['Core','EP1'],['Core','EP2']],
  },
  mesh: {
    nodes: [
      { id:'N1', x:160, y:60, type:'core', label:'N1' },
      { id:'N2', x:300, y:60, type:'server', label:'N2' },
      { id:'N3', x:160, y:160, type:'server', label:'N3' },
      { id:'N4', x:300, y:160, type:'server', label:'N4' },
      { id:'N5', x:160, y:260, type:'firewall', label:'N5' },
      { id:'N6', x:300, y:260, type:'endpoint', label:'N6' },
    ],
    links: [['N1','N2'],['N1','N3'],['N1','N4'],['N2','N3'],['N2','N5'],['N3','N4'],['N3','N6'],['N4','N5'],['N4','N6'],['N5','N6']],
  },
  ring: {
    nodes: [
      { id:'R1', x:200, y:40, type:'core', label:'R1' },
      { id:'R2', x:295, y:100, type:'core', label:'R2' },
      { id:'R3', x:285, y:195, type:'core', label:'R3' },
      { id:'R4', x:200, y:240, type:'core', label:'R4' },
      { id:'SW', x:115, y:195, type:'firewall', label:'SW' },
      { id:'EP', x:105, y:100, type:'endpoint', label:'EP' },
    ],
    links: [['R1','R2'],['R2','R3'],['R3','R4'],['R4','R1'],['R1','SW'],['R3','EP']],
  },
  tree: {
    nodes: [
      { id:'Root', x:220, y:35, type:'core', label:'Root' },
      { id:'L1', x:120, y:120, type:'server', label:'L1' },
      { id:'L2', x:320, y:120, type:'server', label:'L2' },
      { id:'FW', x:70, y:210, type:'firewall', label:'FW' },
      { id:'EP1', x:170, y:210, type:'endpoint', label:'EP1' },
      { id:'EP2', x:270, y:210, type:'endpoint', label:'EP2' },
      { id:'EP3', x:370, y:210, type:'endpoint', label:'EP3' },
    ],
    links: [['Root','L1'],['Root','L2'],['L1','FW'],['L1','EP1'],['L2','EP2'],['L2','EP3'],['FW','EP1']],
  },
};

const TYPE_COLORS = { core:'#00f0ff', server:'#a78bfa', firewall:'#00ff66', endpoint:'#475569' };

export default function TopologyGraph({ topology = 'star', highlightNodes = [] }) {
  const topo = TOPOLOGIES[topology] || TOPOLOGIES.star;
  const { nodes, links } = topo;
  return (
    <svg viewBox="0 0 400 300" style={{ width:'100%', height:'100%' }}>
      <defs>
        <filter id="tglow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {links.map(([a, b], i) => {
        const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
        if (!na || !nb) return null;
        const hl = highlightNodes.includes(na.id) || highlightNodes.includes(nb.id);
        return (
          <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={hl ? 'rgba(255,214,10,0.35)' : 'rgba(0,240,255,0.12)'}
            strokeWidth={hl ? 2 : 1} />
        );
      })}
      {nodes.map(n => {
        const c = TYPE_COLORS[n.type] || '#475569';
        const hl = highlightNodes.includes(n.id);
        const r = n.type === 'core' ? 14 : n.type === 'server' ? 10 : 8;
        return (
          <g key={n.id} filter={hl ? 'url(#tglow)' : undefined}>
            <circle cx={n.x} cy={n.y} r={r + 4} fill={c} opacity={0.08} />
            <circle cx={n.x} cy={n.y} r={r} fill={hl ? '#ffd60a' : c} opacity={0.25} stroke={hl ? '#ffd60a' : c} strokeWidth={1.5} />
            <circle cx={n.x} cy={n.y} r={Math.max(3, r - 5)} fill={hl ? '#ffd60a' : c} />
            <text x={n.x} y={n.y + r + 14} textAnchor="middle"
              fill={hl ? 'var(--accent-amber)' : 'var(--text-muted)'}
              fontSize={9} fontFamily="var(--font-mono)">{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
