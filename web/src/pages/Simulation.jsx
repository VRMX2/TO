import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '../components/ui/AppLayout';
import PageHero from '../components/ui/PageHero';
import { Zap, Play, Square, RefreshCw, ChevronRight, Brain } from 'lucide-react';
import { useGameAPI } from '../hooks/useGameAPI';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../i18n/I18nProvider';
import { apiHeaders } from '../lib/apiClient';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

/* ═══════════════════════════════════════════════════════
   GAME THEORY CORE
═══════════════════════════════════════════════════════ */
const ATTACK_STRATEGIES = [
  { id: 'A1', icon: '⬡', color: '#ff3b30', cost: 2, damage: [5, 2, -1, 4] },
  { id: 'A2', icon: '⬡', color: '#ff6b35', cost: 4, damage: [4, 6, 8, 3] },
  { id: 'A3', icon: '⬡', color: '#ff3b30', cost: 6, damage: [-3, 1, 7, 2] },
  { id: 'A4', icon: '⬡', color: '#ff8c00', cost: 3, damage: [2, -2, 5, 0] },
];
const DEFENSE_STRATEGIES = [
  { id: 'D1', icon: '⬡', color: '#00f0ff', effect: 0 },
  { id: 'D2', icon: '⬡', color: '#00d4e0', effect: 1 },
  { id: 'D3', icon: '⬡', color: '#00f0ff', effect: 2 },
  { id: 'D4', icon: '⬡', color: '#00b4c8', effect: 3 },
];


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

function NetworkSVG({ attackingNode, defendingNode, packets, nodeStates, nodeLabelOverrides }) {
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
              fontFamily="var(--font-mono)" opacity={0.85}>{nodeLabelOverrides?.[n.id] || n.label}</text>
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
  try {
    const response = await fetch('/api/ai/round-advice', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        round,
        attacker: attStrat.name,
        defender: defStrat.name,
        payoff,
        threat,
        coverage,
        history: history.slice(-5),
        mixedNash
      })
    });
    if (!response.ok) throw new Error("Backend unavailable");
    const data = await response.json();
    return data.content?.[0]?.text || 'Analysis unavailable.';
  } catch (err) {
    console.warn("Backend unavailable. Using offline mock analysis.");
    await new Promise(r => setTimeout(r, 600)); // Simulate thinking delay
    return `[OFFLINE MOCK] Analysis for Round ${round}: The attacker deployed ${attStrat.name} and the defender countered with ${defStrat.name}. This resulted in a payoff of ${payoff > 0 ? '+' : ''}${payoff}. The current threat level is at ${threat}% with a coverage of ${coverage}%. To optimize strategy moving forward, the defender should consider shifting probabilities closer to the theoretical Nash equilibrium.`;
  }
}

async function askAI(simState) {
  const { round, attStrat, defStrat, payoff, threat, coverage, history } = simState;
  const response = await fetch('/api/ai/tactical-analysis', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      match_round: round,
      attacker_strategy: attStrat.name,
      defender_strategy: defStrat.name,
      payoff,
      threat_level: threat,
      defense_coverage: coverage,
      history: history.slice(-5),
    })
  });
  const data = await response.json();
  return data.analysis || 'Analysis unavailable.';
}

/* ═══════════════════════════════════════════════════════
   MAIN SIMULATION PAGE
═══════════════════════════════════════════════════════ */
export default function Simulation() {
  const { t } = useI18n();
  const attackNames = t('common.attackStrategies') || [];
  const defenseNames = t('common.defenseStrategies') || [];
  const getAttackNameByIndex = (idx) => attackNames[idx] || `A${idx + 1}`;
  const getDefenseNameByIndex = (idx) => defenseNames[idx] || `D${idx + 1}`;
  const getAttackNameById = (id) => getAttackNameByIndex(Math.max(0, ATTACK_STRATEGIES.findIndex((s) => s.id === id)));
  const getDefenseNameById = (id) => getDefenseNameByIndex(Math.max(0, DEFENSE_STRATEGIES.findIndex((s) => s.id === id)));
  const nodeLabelOverrides = { fw: getDefenseNameByIndex(0) };
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
  
  const [nashData, setNashData] = useState(null);
  const { computeNash } = useGameAPI();
  const setMainPayoff = useGameStore(state => state.setPayoffMatrix);
  const [payoffMatrix, setPayoffMatrix] = useState([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);

  const addLog = useCallback((text, color = 'secondary') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ id: Date.now() + Math.random(), time, text, color }, ...prev.slice(0, 14)]);
  }, []);

  useEffect(() => {
    computeNash(payoffMatrix).then(data => {
      setNashData({
        p: data.attacker_strategy,
        q: data.defender_strategy,
        v: data.attacker_utility
      });
      addLog('Successfully loaded Nash Equilibrium from Python engine', 'green');
    }).catch(err => {
      console.error(err);
      setNashData({ p: [0.25, 0.25, 0.25, 0.25], q: [0.25, 0.25, 0.25, 0.25], v: 0.0 });
      addLog('Failed to connect to backend engine, using fallback distribution', 'red');
    });
  }, [addLog, computeNash, payoffMatrix]);

  const nashP = nashData?.p || [0.25, 0.25, 0.25, 0.25];
  const nashQ = nashData?.q || [0.25, 0.25, 0.25, 0.25];
  const nashV = nashData?.v || 0.0;

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
    const payoff = payoffMatrix[attIdx][defIdx];
    setPayoffMatrix(prev => prev.map((row, r) =>
      r === attIdx && payoff < 0 ? row.map(v => v - 1) :
      row.map((v, c) => c === defIdx && payoff > 0 ? v + 1 : v)
    ));
    const attS = ATTACK_STRATEGIES[attIdx];
    const defS = DEFENSE_STRATEGIES[defIdx];
    const attName = getAttackNameByIndex(attIdx);
    const defName = getDefenseNameByIndex(defIdx);

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
    setThreatLevel(t => Math.max(5, Math.min(98, t + (payoff > 0 ? payoff * 3 : payoff * 2))));
    setCoverage(c => Math.max(5, Math.min(98, c + (payoff < 0 ? 3 : -2))));

    setScore(s => ({
      att: parseFloat((s.att + (payoff > 0 ? payoff : 0)).toFixed(1)),
      def: parseFloat((s.def + (payoff < 0 ? Math.abs(payoff) : 0)).toFixed(1))
    }));

    const newHist = [...hist, { round: roundNum, att: attS.id, def: defS.id, payoff, attName, defName }];

    setChartData(prev => [
      ...prev,
      {
        round: roundNum,
        attacker: parseFloat((payoff > 0 ? payoff : 0).toFixed(2)),
        defender: parseFloat((payoff < 0 ? Math.abs(payoff) : 0).toFixed(2)),
      }
    ]);

    setHistory(newHist);
    const color = payoff > 3 ? 'red' : payoff < 0 ? 'green' : 'amber';
    addLog(`R${roundNum}: ${attName} vs ${defName} → payoff ${payoff > 0 ? '+' : ''}${payoff}`, color);

    // Ask Claude every 4 rounds
    if (roundNum % 4 === 0 || roundNum === 1) {
      setAiLoading(true);
      setThreatLevel(t => t); // force read
      setCoverage(c => c);    // force read
      askClaude({
        round: roundNum, attStrat: attS, defStrat: defS, payoff,
        threat: threatLevel, coverage,
        history: newHist, mixedNash: { p: nashP, q: nashQ, attackNames }
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
  }, [mode, nashP, nashQ, nashV, manualAtt, manualDef, animatePackets, addLog, threatLevel, coverage, attackNames, defenseNames, payoffMatrix, setPayoffMatrix]);

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

  const generateMatrix = () => {
    const m = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Math.floor(Math.random() * 17) - 5)
    );
    setPayoffMatrix(m);
    addLog('New payoff matrix generated — Nash will recompute', 'amber');
  };
  const progress = (round / maxRounds) * 100;

  return (
    <AppLayout wide>
      <div className="page-transition delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
        <PageHero icon={Zap} title={t('simulation.title')} subtitle={t('simulation.aiSubtitle')} />

        {/* ── CONTROL BAR ── */}
        <div className="page-transition delay-2 controls-row" style={{ margin: 0 }}>
          <div style={{ flex: 1 }} />

          {/* Mode */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[['mixed', t('simulation.modeMixed')], ['pure', t('simulation.modeRandom')], ['manual', t('simulation.modeManual')]].map(([v, lbl]) => (
              <button key={v} onClick={() => setMode(v)}
                style={{ ...pillBtn, background: mode === v ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)', color: mode === v ? 'var(--accent-cyan)' : 'var(--text-muted)', border: `1px solid ${mode === v ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                {lbl}
              </button>
            ))}
          </div>

          <button onClick={generateMatrix} disabled={running}
            style={{ ...pillBtn, background: 'rgba(167,139,250,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,240,255,0.25)' }}>
            <RefreshCw size={11} /> MATRIX
          </button>

          {/* Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-mono text-muted" style={{ fontSize: '0.6rem' }}>{t('simulation.speed')}</span>
            <input type="range" min={400} max={3000} step={200} value={speed}
              onChange={e => setSpeed(+e.target.value)} style={{ width: 70, accentColor: 'var(--accent-cyan)' }} />
            <span className="font-mono text-secondary" style={{ fontSize: '0.6rem', width: 30 }}>{(speed / 1000).toFixed(1)}s</span>
          </div>

          {/* Buttons */}
          {!running ? (
            <button onClick={handleStart} style={ctrlBtn('#00f0ff', 'rgba(0,240,255,0.15)')}>
              <Play size={13} /> {round >= maxRounds ? t('simulation.restart') : t('simulation.run')}
            </button>
          ) : (
            <button onClick={handleStop} style={ctrlBtn('#ffd60a', 'rgba(255,214,10,0.12)')}>
              <Square size={13} /> {t('simulation.pause')}
            </button>
          )}
          {mode === 'manual' && !running && (
            <button onClick={handleManualRound} disabled={round >= maxRounds} style={ctrlBtn('#a78bfa', 'rgba(167,139,250,0.12)')}>
              <ChevronRight size={13} /> {t('simulation.step')}
            </button>
          )}
          <button onClick={handleReset} style={ctrlBtn('#475569', 'rgba(255,255,255,0.05)')}>
            <RefreshCw size={11} /> {t('simulation.reset')}
          </button>

          {/* Round progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 120 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span className="font-mono text-secondary" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>{t('simulation.roundLabel')} {round}/{maxRounds}</span>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>

          {/* LEFT: Network + Manual selector */}
          <div className="page-transition delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Panel color="cyan" title={t('simulation.network')} badge={running ? t('simulation.live') : t('simulation.idle')} badgeColor={running ? '#00ff66' : 'var(--text-muted)'}>
              <div style={{ height: 300 }}>
                <NetworkSVG attackingNode={currentAtt} defendingNode={currentDef} packets={packets} nodeStates={nodeStates} nodeLabelOverrides={nodeLabelOverrides} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[['var(--accent-red)', t('simulation.compromised')], ['var(--accent-green)', t('simulation.defended')], ['#ffd60a', t('simulation.alert')], ['var(--text-muted)', t('simulation.neutral')]].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 7, height: 7, background: c, borderRadius: '50%' }} />{l}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Manual Strategy Picker */}
            {mode === 'manual' && (
              <Panel color="amber" title={t('simulation.manualPicker')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="text-red font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>{t('simulation.attacker')}</div>
                    {ATTACK_STRATEGIES.map((s, i) => (
                      <button key={i} onClick={() => setManualAtt(i)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 3, padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', cursor: 'pointer', background: manualAtt === i ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${manualAtt === i ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.06)'}`, color: manualAtt === i ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {s.id}: {getAttackNameByIndex(i)}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="text-cyan font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>{t('simulation.defender')}</div>
                    {DEFENSE_STRATEGIES.map((s, i) => (
                      <button key={i} onClick={() => setManualDef(i)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 3, padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', cursor: 'pointer', background: manualDef === i ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${manualDef === i ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, color: manualDef === i ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                        {s.id}: {getDefenseNameByIndex(i)}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {/* Score */}
            <Panel color="green" title={t('simulation.score')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,59,48,0.07)', borderRadius: 6, border: '1px solid rgba(255,59,48,0.2)' }}>
                  <div className="text-red font-mono" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{score.att}</div>
                  <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginTop: 4 }}>{t('simulation.attackerTotal')}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,240,255,0.07)', borderRadius: 6, border: '1px solid rgba(0,240,255,0.2)' }}>
                  <div className="text-cyan font-mono" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{score.def}</div>
                  <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginTop: 4 }}>{t('simulation.defenderTotal')}</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <Meter label={t('simulation.threatMeter')} value={threatLevel} color={threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
                <Meter label={t('simulation.coverageMeter')} value={coverage} color="var(--accent-cyan)" />
              </div>
            </Panel>

            {/* Payoff Matrix */}
            <Panel color="cyan" title="PAYOFF MATRIX">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.62rem', fontFamily:'var(--font-mono)' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'3px 6px', color:'var(--text-muted)', borderBottom:'1px solid rgba(255,255,255,0.06)', textAlign:'left', fontSize:'0.5rem', lineHeight:1.3 }}>ATT<br />↓<br />DEF →</th>
                      {payoffMatrix[0].map((_, i) => (
                        <th key={i} style={{ padding:'3px 6px', color:'var(--accent-cyan)', borderBottom:'1px solid rgba(255,255,255,0.06)', textAlign:'center', fontSize:'0.55rem', lineHeight:1.3 }}>D{i+1}<br /><span style={{ fontSize:'0.45rem', fontWeight:400, color:'var(--text-muted)' }}>{getDefenseNameByIndex(i)}</span></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payoffMatrix.map((row, r) => (
                      <tr key={r}>
                        <td style={{ padding:'3px 6px', color:'var(--accent-red)', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.55rem', lineHeight:1.3 }}>A{r+1}<br /><span style={{ fontSize:'0.45rem', fontWeight:400, color:'var(--text-muted)' }}>{getAttackNameByIndex(r)}</span></td>
                        {row.map((val, c) => (
                          <td key={c} style={{ padding:'3px 6px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ color: val > 0 ? 'var(--accent-cyan)' : val < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>{val > 0 ? `+${val}` : val}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.5rem', fontSize:'0.52rem' }}>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <span style={{ color:'var(--accent-cyan)' }}>● Defender adv.</span>
                  <span style={{ color:'var(--accent-red)' }}>● Attacker adv.</span>
                </div>
                <button onClick={() => { setMainPayoff(payoffMatrix); addLog('Payoff matrix copied to Dashboard / Analysis / Report', 'green'); }}
                  style={{ background:'rgba(0,240,255,0.1)', border:'1px solid rgba(0,240,255,0.3)', color:'var(--accent-cyan)', borderRadius:4, padding:'2px 8px', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'0.52rem' }}>
                  Copy to Main
                </button>
              </div>
            </Panel>
          </div>

          {/* CENTER: Chart + Strategy probs */}
          <div className="page-transition delay-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Panel color="cyan" title={t('simulation.payoffConvergence')} subtitle={t('simulation.payoffConvergenceSubtitle')}>
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
            <Panel color="amber" title={t('simulation.nashMixedPanel')} subtitle={t('simulation.nashMixedSubtitle', { value: nashV.toFixed(3) })}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-red font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>{t('simulation.attackerSigmaShort')}</div>
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
                  <div className="text-cyan font-mono" style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>{t('simulation.defenderSigmaShort')}</div>
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
            <Panel color="green" title={t('simulation.history')} badge={`${history.length}`}>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
                  <thead>
                    <tr>{t('simulation.historyHeaders').map((h) => <th key={h} style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().slice(0, 10).map((h, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                        <td style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{h.round}</td>
                        <td style={{ padding: '3px 6px', color: 'var(--accent-red)' }}>{h.att}</td>
                        <td style={{ padding: '3px 6px', color: 'var(--accent-cyan)' }}>{h.def}</td>
                        <td style={{ padding: '3px 6px', fontFamily: 'var(--font-mono)', color: h.payoff > 0 ? 'var(--accent-red)' : h.payoff < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{h.payoff > 0 ? '-' : h.payoff < 0 ? '+' : ''}{Math.abs(h.payoff)}</td>
                        <td style={{ padding: '3px 6px' }}>
                          {h.payoff > 0 ? <span style={{ fontSize: '0.52rem', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{t('simulation.resultAtt')}</span>
                            : h.payoff < 0 ? <span style={{ fontSize: '0.52rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{t('simulation.resultDef')}</span>
                              : <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('simulation.resultTie')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && <div className="text-muted font-mono" style={{ fontSize: '0.62rem', textAlign: 'center', padding: '1rem' }}>{t('simulation.noRounds')}</div>}
              </div>
            </Panel>
          </div>

          {/* RIGHT: AI Analysis + Logs */}
          <div className="page-transition delay-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* AI Monitor */}
            <Panel color="cyan" title={t('simulation.aiMonitor')} badge={t('simulation.live')} badgeColor="#00ff66">
              <Meter label={t('simulation.threatMeter')} value={threatLevel} color={threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
              <Meter label={t('simulation.coverageMeter')} value={coverage} color="var(--accent-cyan)" />
            </Panel>

            {/* Claude AI Analysis */}
            <Panel color="amber" title={t('simulation.aiAnalysis')} subtitle={t('simulation.aiSubtitle')} badge={aiLoading ? t('simulation.statusThinking') : round > 0 ? t('simulation.statusReady') : t('simulation.idle')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Brain size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  {aiLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-amber)', animation: 'pulse 1s infinite' }} />
                      <span className="font-mono text-amber" style={{ fontSize: '0.65rem' }}>{t('simulation.aiThinking')}</span>
                    </div>
                  ) : aiAnalysis ? (
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-mono)' }}>{aiAnalysis}</p>
                  ) : (
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-mono)' }}>
                      {t('simulation.aiPlaceholder')}
                    </p>
                  )}
                </div>
              </div>
              {round > 0 && !running && !aiLoading && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => {
                  if (history.length === 0) return;
                  setAiLoading(true);
                  const last = history[history.length - 1];
                  askClaude({
                    round,
                    attStrat: { ...(ATTACK_STRATEGIES.find((s) => s.id === last.att) || {}), name: getAttackNameById(last.att) },
                    defStrat: { ...(DEFENSE_STRATEGIES.find((s) => s.id === last.def) || {}), name: getDefenseNameById(last.def) },
                    payoff: last.payoff,
                    threat: threatLevel,
                    coverage,
                    history,
                    mixedNash: { p: nashP, q: nashQ, attackNames },
                  })
                    .then(t => { setAiAnalysis(t); setAiLoading(false); })
                    .catch(() => setAiLoading(false));
                }} style={{ ...ctrlBtn('var(--accent-amber)', 'rgba(255,214,10,0.1)'), flex: 1, justifyContent: 'center', fontSize: '0.62rem' }}>
                  <Brain size={11} /> {t('simulation.requestAi')}
                </button>
                <button onClick={() => {
                  if (history.length === 0) return;
                  setAiLoading(true);
                  const last = history[history.length - 1];
                  askAI({
                    round,
                    attStrat: { ...(ATTACK_STRATEGIES.find((s) => s.id === last.att) || {}), name: getAttackNameById(last.att) },
                    defStrat: { ...(DEFENSE_STRATEGIES.find((s) => s.id === last.def) || {}), name: getDefenseNameById(last.def) },
                    payoff: last.payoff,
                    threat: threatLevel,
                    coverage,
                    history,
                  })
                    .then(t => { setAiAnalysis(t); setAiLoading(false); })
                    .catch(() => setAiLoading(false));
                }} style={{ ...ctrlBtn('var(--accent-cyan)', 'rgba(0,240,255,0.1)'), flex: 1, justifyContent: 'center', fontSize: '0.62rem' }}>
                  <Brain size={11} /> TACTICAL ANALYSIS
                </button>
                </div>
              )}
            </Panel>

            {/* Event Log */}
            <Panel color="green" title={t('simulation.simLog')} style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 280, overflowY: 'auto' }}>
                {logs.map(log => {
                  const clrMap = { cyan: 'var(--accent-cyan)', green: 'var(--accent-green)', amber: 'var(--accent-amber)', red: 'var(--accent-red)', secondary: 'var(--text-secondary)' };
                  const c = clrMap[log.color] || 'var(--text-secondary)';
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.28rem 0.5rem', borderRadius: 5, background: `${c}06`, borderLeft: `2px solid ${c}40` }}>
                      <span className="font-mono text-muted" style={{ fontSize: '0.5rem', whiteSpace: 'nowrap', marginTop: 2, flexShrink: 0 }}>{log.time}</span>
                      <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: c, lineHeight: 1.5 }}>{log.text}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Current Round Info */}
            {history.length > 0 && (
              <Panel color="red" title={t('simulation.lastRound')}>
                {(() => {
                  const last = history[history.length - 1];
                  const attS = ATTACK_STRATEGIES.find(s => s.id === last.att);
                  const defS = DEFENSE_STRATEGIES.find(s => s.id === last.def);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,59,48,0.07)', borderRadius: 5, border: '1px solid rgba(255,59,48,0.2)' }}>
                        <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginBottom: 3 }}>{t('simulation.lastAttackerPlayed')}</div>
                        <div className="text-red font-mono" style={{ fontSize: '0.72rem' }}>{last.att}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{getAttackNameById(last.att)}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '0.52rem', marginTop: 4 }}>σ*: {(nashP[ATTACK_STRATEGIES.indexOf(attS)] * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ padding: '0.6rem', background: 'rgba(0,240,255,0.07)', borderRadius: 5, border: '1px solid rgba(0,240,255,0.2)' }}>
                        <div className="text-muted font-mono" style={{ fontSize: '0.55rem', marginBottom: 3 }}>{t('simulation.lastDefenderPlayed')}</div>
                        <div className="text-cyan font-mono" style={{ fontSize: '0.72rem' }}>{last.def}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{getDefenseNameById(last.def)}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '0.52rem', marginTop: 4 }}>σ*: {(nashQ[DEFENSE_STRATEGIES.indexOf(defS)] * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '0.5rem', background: last.payoff > 0 ? 'rgba(255,59,48,0.07)' : last.payoff < 0 ? 'rgba(0,240,255,0.07)' : 'rgba(255,255,255,0.03)', borderRadius: 5, border: `1px solid ${last.payoff > 0 ? 'rgba(255,59,48,0.25)' : last.payoff < 0 ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                        <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('simulation.payoffUA')} </span>
                        <span className="font-mono" style={{ fontSize: '1.1rem', color: last.payoff > 0 ? 'var(--accent-red)' : last.payoff < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{last.payoff > 0 ? '-' : last.payoff < 0 ? '+' : ''}{Math.abs(last.payoff)}</span>
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
    </AppLayout>
  );
}

/* ── Helper components ── */
function Panel({ color, title, subtitle, badge, badgeColor, children }) {
  const accent = { cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)', red: 'var(--accent-red)' }[color] || 'var(--border-subtle)';
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.9))',
      border: `1px solid ${accent}28`,
      borderTop: `2px solid ${accent}55`,
      borderRadius: 12, padding: '1rem',
      backdropFilter: 'blur(12px)',
      boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.04)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.7rem', color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{title}</span>
          {subtitle && <p className="text-muted" style={{ fontSize: '0.56rem', margin: 0, marginTop: 2 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ background: `${badgeColor || accent}15`, border: `1px solid ${badgeColor || accent}40`, color: badgeColor || accent, padding: '2px 8px', borderRadius: 12, fontSize: '0.55rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Meter({ label, value, color }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span className="font-mono text-muted" style={{ fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: '0.7rem', color, fontWeight: 500, textShadow: `0 0 8px ${color}` }}>{Math.round(value)}%</span>
      </div>
      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round(value)}%`, height: '100%', background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 4, boxShadow: `0 0 8px ${color}`, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  );
}

const pillBtn = { padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' };
const ctrlBtn = (color, bg) => ({ background: bg, border: `1px solid ${color}55`, color, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.63rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 4px 15px ${color}15` });