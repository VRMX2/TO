import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import {
  Zap, Shield, Cpu, Activity, Play, Square, RefreshCw,
  AlertTriangle, CheckCircle, ChevronRight, Wifi, WifiOff, Brain
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

/* ═══════════════════════════════════════════════════════
   GAME THEORY CORE
═══════════════════════════════════════════════════════ */
const ATTACK_STRATEGIES = [
  { id: 'A1', name: 'SQL Injection', icon: '⬡', color: '#ff3b30', cost: 2, damage: [5, 2, -1, 4] },
  { id: 'A2', name: 'DDoS Flood', icon: '⬡', color: '#ff6b35', cost: 4, damage: [4, 6, 8, 3] },
  { id: 'A3', name: 'Zero-Day Exploit', icon: '⬡', color: '#ff3b30', cost: 6, damage: [-3, 1, 7, 2] },
  { id: 'A4', name: 'Phishing APT', icon: '⬡', color: '#ff8c00', cost: 3, damage: [2, -2, 5, 0] },
];
const DEFENSE_STRATEGIES = [
  { id: 'D1', name: 'Firewall', icon: '⬡', color: '#00f0ff', effect: 0 },
  { id: 'D2', name: 'Intrusion Det.', icon: '⬡', color: '#00d4e0', effect: 1 },
  { id: 'D3', name: 'Patch System', icon: '⬡', color: '#00f0ff', effect: 2 },
  { id: 'D4', name: 'Honey Pot', icon: '⬡', color: '#00b4c8', effect: 3 },
];
const PAYOFF = [
  [5, 2, -1, 4],
  [4, 6, 8, 3],
  [-3, 1, 7, 2],
  [2, -2, 5, 0],
];

function solveMixed(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let p = Array(m).fill(1 / m), q = Array(n).fill(1 / n);
  for (let it = 0; it < 3000; it++) {
    const ap = p.map((_, i) => q.reduce((s, qj, j) => s + qj * matrix[i][j], 0));
    const dp = q.map((_, j) => p.reduce((s, pi, i) => s + pi * matrix[i][j], 0));
    const ma = p.reduce((s, pi, i) => s + pi * ap[i], 0), md = q.reduce((s, qj, j) => s + qj * dp[j], 0);
    p = p.map((pi, i) => Math.max(1e-9, pi + 0.04 * (ap[i] - ma)));
    q = q.map((qj, j) => Math.max(1e-9, qj - 0.04 * (dp[j] - md)));
    const sp = p.reduce((a, b) => a + b, 0), sq = q.reduce((a, b) => a + b, 0);
    p = p.map(v => v / sp); q = q.map(v => v / sq);
  }
  const v = p.reduce((s, pi, i) => s + q.reduce((ss, qj, j) => ss + pi * qj * matrix[i][j], 0), 0);
  return { p, q, v };
}

function sampleStrategy(probs) {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) { cum += probs[i]; if (r < cum) return i; }
  return probs.length - 1;
}

/* ═══════════════════════════════════════════════════════
   NETWORK TOPOLOGY SVG
═══════════════════════════════════════════════════════ */
const NODES = [
  { id: 'core', x: 260, y: 180, label: 'Core Router', type: 'core' },
  { id: 'web', x: 130, y: 80, label: 'Web Server', type: 'server' },
  { id: 'app', x: 260, y: 60, label: 'App Server', type: 'server' },
  { id: 'db', x: 390, y: 80, label: 'DB Server', type: 'server' },
  { id: 'epA', x: 420, y: 190, label: 'Endpoint A', type: 'endpoint' },
  { id: 'epB', x: 360, y: 290, label: 'Endpoint B', type: 'endpoint' },
  { id: 'fw', x: 160, y: 290, label: 'Firewall', type: 'firewall' },
  { id: 'epC', x: 90, y: 190, label: 'Endpoint C', type: 'endpoint' },
  { id: 'attacker', x: 260, y: 340, label: 'ATTACKER', type: 'attacker' },
];
const LINKS = [
  ['core', 'web'], ['core', 'app'], ['core', 'db'], ['core', 'epA'], ['core', 'epB'],
  ['core', 'fw'], ['core', 'epC'], ['fw', 'epC'], ['fw', 'web'],
  ['attacker', 'fw'], ['attacker', 'epB'], ['attacker', 'epA'],
];

function NetworkSVG({ attackingNode, defendingNode, packets, nodeStates }) {
  const getNodeColor = (id) => {
    const state = nodeStates[id];
    if (state === 'compromised') return '#ff3b30';
    if (state === 'defended') return '#00ff66';
    if (state === 'alert') return '#ffd60a';
    const n = NODES.find(x => x.id === id);
    if (n?.type === 'core') return '#00f0ff';
    if (n?.type === 'firewall') return '#00ff66';
    if (n?.type === 'attacker') return '#ff3b30';
    if (n?.type === 'server') return '#a78bfa';
    return '#475569';
  };
  return (
    <svg viewBox="0 0 520 380" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id="glow-c"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-r"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {LINKS.map(([a, b], i) => {
        const na = NODES.find(x => x.id === a), nb = NODES.find(x => x.id === b);
        const isActive = (a === attackingNode || b === attackingNode) && attackingNode;
        const isDefended = (a === defendingNode || b === defendingNode) && defendingNode;
        return (
          <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={isActive ? '#ff3b3088' : isDefended ? '#00ff6644' : 'rgba(0,240,255,0.12)'}
            strokeWidth={isActive ? 2 : 1} strokeDasharray={isActive ? '4 3' : 'none'} />
        );
      })}
      {packets.map(pk => (
        <circle key={pk.id} cx={pk.x} cy={pk.y} r={4} fill={pk.color} filter="url(#glow-c)" opacity={0.9} />
      ))}
      {NODES.map(n => {
        const color = getNodeColor(n.id);
        const r = n.type === 'core' ? 18 : n.type === 'attacker' ? 14 : 10;
        const isAtt = n.id === attackingNode;
        const isDef = n.id === defendingNode;
        return (
          <g key={n.id} filter={isAtt || isDef ? 'url(#glow-r)' : undefined}>
            <circle cx={n.x} cy={n.y} r={r + 6} fill={color} opacity={0.1} />
            <circle cx={n.x} cy={n.y} r={r} fill={color} opacity={0.2} stroke={color} strokeWidth={1.5} />
            <circle cx={n.x} cy={n.y} r={r - 5} fill={color} />
            <text x={n.x} y={n.y + r + 13} textAnchor="middle" fill={color} fontSize={9}
              fontFamily="var(--font-mono)" opacity={0.85}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   AI CLAUDE INTEGRATION
═══════════════════════════════════════════════════════ */
async function askClaude(simState) {
  const { round, attStrat, defStrat, payoff, threat, coverage, history, mixedNash } = simState;
  const prompt = `You are an AI security analyst embedded in a real-time cyber-security game-theory simulation.

Current simulation state (Round ${round}/20):
- Attacker played: ${attStrat.name} (strategy ${attStrat.id})
- Defender played: ${defStrat.name} (strategy ${defStrat.id})
- Payoff this round: ${payoff > 0 ? '+' + payoff : payoff} (positive = attacker wins)
- Threat level: ${threat}%
- Defense coverage: ${coverage}%
- Nash mixed equilibrium: Attacker plays ${ATTACK_STRATEGIES.map((_, i) => `A${i + 1}=${(mixedNash.p[i] * 100).toFixed(0)}%`).join(', ')}
- Recent history: ${history.slice(-3).map(h => `[R${h.round}: ${h.att}vs${h.def}→${h.payoff > 0 ? '+' : ''}${h.payoff}]`).join(' ')}

Give a concise 2-3 sentence tactical analysis: what just happened, whether either player deviated from Nash equilibrium, and one specific recommendation for the defender next round. Be precise about game theory concepts. No bullet points.`;

  const response = await fetch('/api/claude/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 180,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text || 'Analysis unavailable.';
}

/* ═══════════════════════════════════════════════════════
   MAIN SIMULATION PAGE
═══════════════════════════════════════════════════════ */
export default function Simulation() {
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(20);
  const [speed, setSpeed] = useState(1800);
  const [mode, setMode] = useState('mixed'); // 'mixed' | 'pure' | 'manual'

  const [threatLevel, setThreatLevel] = useState(40);
  const [coverage, setCoverage] = useState(65);
  const [score, setScore] = useState({ att: 0, def: 0 });
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [currentAtt, setCurrentAtt] = useState(null);
  const [currentDef, setCurrentDef] = useState(null);
  const [nodeStates, setNodeStates] = useState({});
  const [packets, setPackets] = useState([]);

  const [logs, setLogs] = useState([
    { id: 0, time: '--:--:--', text: 'Simulation engine ready. Press RUN to begin.', color: 'cyan' }
  ]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualAtt, setManualAtt] = useState(0);
  const [manualDef, setManualDef] = useState(0);

  const timerRef = useRef(null);
  const packetRef = useRef(null);
  const { p: nashP, q: nashQ, v: nashV } = solveMixed(PAYOFF);

  const addLog = useCallback((text, color = 'secondary') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ id: Date.now() + Math.random(), time, text, color }, ...prev.slice(0, 14)]);
  }, []);

  const animatePackets = useCallback((src, dst, color) => {
    const srcNode = NODES.find(n => n.id === src);
    const dstNode = NODES.find(n => n.id === dst);
    if (!srcNode || !dstNode) return;
    const steps = 18;
    let step = 0;
    const id = Date.now();
    const tick = () => {
      step++;
      const t = step / steps;
      const x = srcNode.x + (dstNode.x - srcNode.x) * t;
      const y = srcNode.y + (dstNode.y - srcNode.y) * t;
      setPackets(prev => {
        const filtered = prev.filter(p => p.id !== id);
        if (step < steps) return [...filtered, { id, x, y, color }];
        return filtered;
      });
      if (step < steps) packetRef.current = setTimeout(tick, 40);
    };
    tick();
  }, []);

  const runRound = useCallback((roundNum, hist) => {
    const attIdx = mode === 'mixed' ? sampleStrategy(nashP) : mode === 'manual' ? manualAtt : Math.floor(Math.random() * 4);
    const defIdx = mode === 'mixed' ? sampleStrategy(nashQ) : mode === 'manual' ? manualDef : Math.floor(Math.random() * 4);
    const payoff = PAYOFF[attIdx][defIdx];
    const attS = ATTACK_STRATEGIES[attIdx];
    const defS = DEFENSE_STRATEGIES[defIdx];

    setCurrentAtt(attS.id.toLowerCase().replace(' ', ''));
    setCurrentDef(defS.id.toLowerCase().replace(' ', ''));

    // Animate attack packet
    const targets = ['epB', 'epA', 'web', 'app', 'db'];
    const target = targets[attIdx % targets.length];
    animatePackets('attacker', 'fw', '#ff3b30');
    setTimeout(() => animatePackets('fw', target, payoff > 0 ? '#ff3b30' : '#00f0ff'), 400);

    // Update node states
    setNodeStates(prev => {
      const next = { ...prev };
      if (payoff > 0) {
        next[target] = 'compromised';
        next['fw'] = 'alert';
      } else {
        next[target] = 'defended';
        next['fw'] = 'defended';
        if (next['core'] === 'compromised') delete next['core'];
      }
      return next;
    });

    // Update threat & coverage
    const newThreat = Math.max(5, Math.min(98, prev => prev + (payoff > 0 ? payoff * 3 : payoff * 2)));
    const newCov = Math.max(5, Math.min(98, prev => prev + (payoff < 0 ? 3 : -2)));
    setThreatLevel(t => Math.max(5, Math.min(98, t + (payoff > 0 ? payoff * 3 : payoff * 2))));
    setCoverage(c => Math.max(5, Math.min(98, c + (payoff < 0 ? 3 : -2))));

    setScore(s => ({
      att: parseFloat((s.att + (payoff > 0 ? payoff : 0)).toFixed(1)),
      def: parseFloat((s.def + (payoff < 0 ? Math.abs(payoff) : 0)).toFixed(1))
    }));

    const newHist = [...hist, { round: roundNum, att: attS.id, def: defS.id, payoff, attName: attS.name, defName: defS.name }];

    setChartData(prev => [
      ...prev,
      {
        round: roundNum,
        attacker: parseFloat((payoff > 0 ? payoff : 0).toFixed(2)),
        defender: parseFloat((payoff < 0 ? Math.abs(payoff) : 0).toFixed(2)),
        nashLine: parseFloat(Math.abs(nashV).toFixed(2)),
      }
    ]);

    setHistory(newHist);
    const color = payoff > 3 ? 'red' : payoff < 0 ? 'green' : 'amber';
    addLog(`R${roundNum}: ${attS.name} vs ${defS.name} → payoff ${payoff > 0 ? '+' : ''}${payoff}`, color);

    // Ask Claude every 4 rounds
    if (roundNum % 4 === 0 || roundNum === 1) {
      setAiLoading(true);
      setThreatLevel(t => t); // force read
      setCoverage(c => c);    // force read
      askClaude({
        round: roundNum, attStrat: attS, defStrat: defS, payoff,
        threat: threatLevel, coverage,
        history: newHist, mixedNash: { p: nashP, q: nashQ }
      }).then(text => {
        setAiAnalysis(text);
        setAiLoading(false);
        addLog('AI analysis updated', 'cyan');
      }).catch(() => {
        setAiLoading(false);
        addLog('AI analysis unavailable', 'amber');
      });
    }

    return newHist;
  }, [mode, nashP, nashQ, nashV, manualAtt, manualDef, animatePackets, addLog, threatLevel, coverage]);

  useEffect(() => {
    if (!running) { clearTimeout(timerRef.current); return; }
    if (round >= maxRounds) { setRunning(false); addLog('Simulation complete!', 'green'); return; }

    let hist = history;
    const tick = (r) => {
      if (r >= maxRounds) { setRunning(false); addLog('Simulation complete!', 'green'); return; }
      hist = runRound(r + 1, hist);
      setRound(r + 1);
      timerRef.current = setTimeout(() => tick(r + 1), speed);
    };
    timerRef.current = setTimeout(() => tick(round), 200);
    return () => clearTimeout(timerRef.current);
  }, [running]);

  const handleStart = () => {
    if (round >= maxRounds) {
      setRound(0); setHistory([]); setChartData([]); setScore({ att: 0, def: 0 });
      setThreatLevel(40); setCoverage(65); setNodeStates({}); setAiAnalysis('');
      setLogs([{ id: 0, time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Simulation reset. Starting...', color: 'cyan' }]);
    }
    setRunning(true);
  };

  const handleStop = () => { setRunning(false); clearTimeout(timerRef.current); addLog('Simulation paused.', 'amber'); };
  const handleReset = () => {
    handleStop();
    setRound(0); setHistory([]); setChartData([]); setScore({ att: 0, def: 0 });
    setThreatLevel(40); setCoverage(65); setNodeStates({}); setCurrentAtt(null); setCurrentDef(null);
    setAiAnalysis(''); setPackets([]);
    setLogs([{ id: 0, time: '--:--:--', text: 'Simulation reset.', color: 'secondary' }]);
  };

  const handleManualRound = () => { if (!running) { const h = runRound(round + 1, history); setRound(r => r + 1); setHistory(h); } };
  const progress = (round / maxRounds) * 100;

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ gridColumn: '1 / -1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

        {/* ── CONTROL BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.75rem 1rem' }}>
          <Zap size={16} className="text-red" />
          <span className="font-mono text-primary" style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>ADVANCED THREAT SIMULATION</span>
          <div style={{ flex: 1 }} />

          {/* Mode */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[['mixed', 'MIXED NASH'], ['pure', 'RANDOM'], ['manual', 'MANUAL']].map(([v, lbl]) => (
              <button key={v} onClick={() => setMode(v)}
                style={{ ...pillBtn, background: mode === v ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)', color: mode === v ? 'var(--accent-cyan)' : 'var(--text-muted)', border: `1px solid ${mode === v ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-mono text-muted" style={{ fontSize: '0.6rem' }}>SPEED</span>
            <input type="range" min={400} max={3000} step={200} value={speed}
              onChange={e => setSpeed(+e.target.value)} style={{ width: 70, accentColor: 'var(--accent-cyan)' }} />
            <span className="font-mono text-secondary" style={{ fontSize: '0.6rem', width: 30 }}>{(speed / 1000).toFixed(1)}s</span>
          </div>

          {/* Buttons */}
          {!running ? (
            <button onClick={handleStart} style={ctrlBtn('#00f0ff', 'rgba(0,240,255,0.15)')}>
              <Play size={13} /> {round >= maxRounds ? 'RESTART' : 'RUN'}
            </button>
          ) : (
            <button onClick={handleStop} style={ctrlBtn('#ffd60a', 'rgba(255,214,10,0.12)')}>
              <Square size={13} /> PAUSE
            </button>
          )}
          {mode === 'manual' && !running && (
            <button onClick={handleManualRound} disabled={round >= maxRounds} style={ctrlBtn('#a78bfa', 'rgba(167,139,250,0.12)')}>
              <ChevronRight size={13} /> STEP
            </button>
          )}
          <button onClick={handleReset} style={ctrlBtn('#475569', 'rgba(255,255,255,0.05)')}>
            <RefreshCw size={11} /> RESET
          </button>

          {/* Round progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 120 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span className="font-mono text-secondary" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>R {round}/{maxRounds}</span>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>

          {/* LEFT: Network + Manual selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Panel color="cyan" title="NETWORK TOPOLOGY" badge={running ? '● LIVE' : '○ IDLE'} badgeColor={running ? '#00ff66' : 'var(--text-muted)'}>
              <div style={{ height: 300 }}>
                <NetworkSVG attackingNode={currentAtt} defendingNode={currentDef} packets={packets} nodeStates={nodeStates} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[['var(--accent-red)', 'Compromised'], ['var(--accent-green)', 'Defended'], ['#ffd60a', 'Alert'], ['var(--text-muted)', 'Neutral']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 7, height: 7, background: c, borderRadius: '50%' }} />{l}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Manual Strategy Picker */}
            {mode === 'manual' && (
              <Panel color="amber" title="MANUAL STRATEGY PICKER">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="text-red font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>ATTACKER</div>
                    {ATTACK_STRATEGIES.map((s, i) => (
                      <button key={i} onClick={() => setManualAtt(i)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 3, padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', cursor: 'pointer', background: manualAtt === i ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${manualAtt === i ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.06)'}`, color: manualAtt === i ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {s.id}: {s.name}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="text-cyan font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>DEFENDER</div>
                    {DEFENSE_STRATEGIES.map((s, i) => (
                      <button key={i} onClick={() => setManualDef(i)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 3, padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', cursor: 'pointer', background: manualDef === i ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${manualDef === i ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, color: manualDef === i ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                        {s.id}: {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {/* Score */}
            <Panel color="green" title="CUMULATIVE SCORE">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,59,48,0.07)', borderRadius: 6, border: '1px solid rgba(255,59,48,0.2)' }}>
                  <div className="text-red font-mono" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{score.att}</div>
                  <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginTop: 4 }}>ATTACKER TOTAL</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,240,255,0.07)', borderRadius: 6, border: '1px solid rgba(0,240,255,0.2)' }}>
                  <div className="text-cyan font-mono" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{score.def}</div>
                  <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginTop: 4 }}>DEFENDER TOTAL</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <Meter label="THREAT LEVEL" value={threatLevel} color={threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
                <Meter label="DEFENSE COV." value={coverage} color="var(--accent-cyan)" />
              </div>
            </Panel>
          </div>

          {/* CENTER: Chart + Strategy probs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Panel color="cyan" title="PAYOFF CONVERGENCE" subtitle="Attacker vs Defender gain per round">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="round" stroke="var(--text-muted)" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: '#0a0e17', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                    <ReferenceLine y={Math.abs(nashV)} stroke="var(--accent-amber)" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'v*', position: 'right', fill: 'var(--accent-amber)', fontSize: 9 }} />
                    <Line type="monotone" dataKey="attacker" stroke="#ff3b30" strokeWidth={2} dot={false} name="Attacker" />
                    <Line type="monotone" dataKey="defender" stroke="#00f0ff" strokeWidth={2} dot={false} name="Defender" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Nash Equilibrium Probabilities */}
            <Panel color="amber" title="NASH MIXED STRATEGY σ*" subtitle={`Game value v* = ${nashV.toFixed(3)}`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-red font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>σ*_A (Attacker)</div>
                  {nashP.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.35rem' }}>
                      <span className="font-mono text-muted" style={{ width: 18, fontSize: '0.58rem' }}>A{i + 1}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-red)', borderRadius: 2 }} />
                      </div>
                      <span className="font-mono" style={{ width: 35, fontSize: '0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-cyan font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>σ*_D (Defender)</div>
                  {nashQ.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.35rem' }}>
                      <span className="font-mono text-muted" style={{ width: 18, fontSize: '0.58rem' }}>D{i + 1}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
                      </div>
                      <span className="font-mono" style={{ width: 35, fontSize: '0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Round History Table */}
            <Panel color="green" title="ROUND HISTORY" badge={`${history.length} rounds`}>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
                  <thead>
                    <tr>{['R', 'Attacker', 'Defender', 'Payoff', 'Result'].map(h => <th key={h} style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().slice(0, 10).map((h, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                        <td style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{h.round}</td>
                        <td style={{ padding: '3px 6px', color: 'var(--accent-red)' }}>{h.att}</td>
                        <td style={{ padding: '3px 6px', color: 'var(--accent-cyan)' }}>{h.def}</td>
                        <td style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', color: h.payoff > 0 ? 'var(--accent-red)' : h.payoff < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{h.payoff > 0 ? '+' : ''}{h.payoff}</td>
                        <td style={{ padding: '3px 6px' }}>
                          {h.payoff > 0 ? <span style={{ fontSize: '0.52rem', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>ATT WINS</span>
                            : h.payoff < 0 ? <span style={{ fontSize: '0.52rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>DEF WINS</span>
                              : <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TIE</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && <div className="text-muted font-mono" style={{ fontSize: '0.62rem', textAlign: 'center', padding: '1rem' }}>No rounds played yet</div>}
              </div>
            </Panel>
          </div>

          {/* RIGHT: AI Analysis + Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* AI Monitor */}
            <Panel color="cyan" title="AI DEFENSE MONITOR" badge="● ACTIVE" badgeColor="#00ff66">
              <Meter label="THREAT LEVEL" value={threatLevel} color={threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
              <Meter label="DEFENSE COV." value={coverage} color="var(--accent-cyan)" />
            </Panel>

            {/* Claude AI Analysis */}
            <Panel color="amber" title="CLAUDE AI ANALYSIS" subtitle="Real-time game-theoretic AI advisor" badge={aiLoading ? '⟳ THINKING' : round > 0 ? '● READY' : '○ IDLE'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Brain size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  {aiLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-amber)', animation: 'pulse 1s infinite' }} />
                      <span className="font-mono text-amber" style={{ fontSize: '0.65rem' }}>Analyzing round data...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-mono)' }}>{aiAnalysis}</p>
                  ) : (
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-mono)' }}>
                      AI tactical analysis will appear here after Round 1. Claude analyzes strategy alignment with Nash equilibrium and provides defender recommendations.
                    </p>
                  )}
                </div>
              </div>
              {round > 0 && !running && !aiLoading && (
                <button onClick={() => {
                  if (history.length === 0) return;
                  setAiLoading(true);
                  const last = history[history.length - 1];
                  askClaude({ round, attStrat: ATTACK_STRATEGIES.find(s => s.id === last.att), defStrat: DEFENSE_STRATEGIES.find(s => s.id === last.def), payoff: last.payoff, threat: threatLevel, coverage, history, mixedNash: { p: nashP, q: nashQ } })
                    .then(t => { setAiAnalysis(t); setAiLoading(false); })
                    .catch(() => setAiLoading(false));
                }} style={{ ...ctrlBtn('var(--accent-amber)', 'rgba(255,214,10,0.1)'), marginTop: '0.5rem', width: '100%', justifyContent: 'center', fontSize: '0.62rem' }}>
                  <Brain size={11} /> REQUEST AI ANALYSIS
                </button>
              )}
            </Panel>

            {/* Event Log */}
            <Panel color="green" title="SIMULATION LOG" style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
                {logs.map(log => {
                  const clrMap = { cyan: 'var(--accent-cyan)', green: 'var(--accent-green)', amber: 'var(--accent-amber)', red: 'var(--accent-red)', secondary: 'var(--text-secondary)' };
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span className="font-mono text-muted" style={{ fontSize: '0.55rem', whiteSpace: 'nowrap', marginTop: 1 }}>{log.time}</span>
                      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: clrMap[log.color] || 'var(--text-secondary)', lineHeight: 1.4 }}>{log.text}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Current Round Info */}
            {history.length > 0 && (
              <Panel color="red" title="LAST ROUND DETAIL">
                {(() => {
                  const last = history[history.length - 1];
                  const attS = ATTACK_STRATEGIES.find(s => s.id === last.att);
                  const defS = DEFENSE_STRATEGIES.find(s => s.id === last.def);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,59,48,0.07)', borderRadius: 5, border: '1px solid rgba(255,59,48,0.2)' }}>
                        <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginBottom: 3 }}>ATTACKER PLAYED</div>
                        <div className="text-red font-mono" style={{ fontSize: '0.72rem' }}>{last.att}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{attS?.name}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '0.52rem', marginTop: 4 }}>σ*: {(nashP[ATTACK_STRATEGIES.indexOf(attS)] * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ padding: '0.6rem', background: 'rgba(0,240,255,0.07)', borderRadius: 5, border: '1px solid rgba(0,240,255,0.2)' }}>
                        <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginBottom: 3 }}>DEFENDER PLAYED</div>
                        <div className="text-cyan font-mono" style={{ fontSize: '0.72rem' }}>{last.def}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{defS?.name}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '0.52rem', marginTop: 4 }}>σ*: {(nashQ[DEFENSE_STRATEGIES.indexOf(defS)] * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '0.5rem', background: last.payoff > 0 ? 'rgba(255,59,48,0.07)' : last.payoff < 0 ? 'rgba(0,255,102,0.07)' : 'rgba(255,255,255,0.03)', borderRadius: 5, border: `1px solid ${last.payoff > 0 ? 'rgba(255,59,48,0.25)' : last.payoff < 0 ? 'rgba(0,255,102,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                        <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>PAYOFF u_A = </span>
                        <span className="font-mono" style={{ fontSize: '1.1rem', color: last.payoff > 0 ? 'var(--accent-red)' : last.payoff < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{last.payoff > 0 ? '+' : ''}{last.payoff}</span>
                      </div>
                    </div>
                  );
                })()}
              </Panel>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

/* ── Helper components ── */
function Panel({ color, title, subtitle, badge, badgeColor, children }) {
  const accent = { cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)', red: 'var(--accent-red)' }[color] || 'var(--border-subtle)';
  return (
    <div style={{ background: 'var(--bg-panel)', border: `1px solid ${accent}28`, borderRadius: 8, padding: '0.875rem', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${accent}18` }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.68rem', color: accent, letterSpacing: '0.08em' }}>{title}</span>
          {subtitle && <p className="text-muted" style={{ fontSize: '0.56rem', margin: 0, marginTop: 1 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ background: `${badgeColor || accent}18`, border: `1px solid ${badgeColor || accent}45`, color: badgeColor || accent, padding: '2px 6px', borderRadius: 4, fontSize: '0.56rem', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Meter({ label, value, color }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: '0.58rem', color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div style={{ width: `${Math.round(value)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

const pillBtn = { padding: '4px 9px', borderRadius: 4, cursor: 'pointer', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' };
const ctrlBtn = (color, bg) => ({ background: bg, border: `1px solid ${color}66`, color, padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.05em', whiteSpace: 'nowrap' });