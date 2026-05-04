import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { useGameStore } from '../store/gameStore';
import { useNash } from '../hooks/useNash';
import { useGameAPI } from '../hooks/useGameAPI';
import { Target, Shield, Zap, Activity, RefreshCw, Cpu, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function Dashboard() {
  const simulateAttack = useGameStore(state => state.simulateAttack);
  const deployDefense = useGameStore(state => state.deployDefense);
  const attackerStrategies = useGameStore(state => state.attackerStrategies);
  const defenderStrategies = useGameStore(state => state.defenderStrategies);
  const payoffMatrix = useGameStore(state => state.payoffMatrix);
  const threatLevel = useGameStore(state => state.threatLevel);
  const defenseCoverage = useGameStore(state => state.defenseCoverage);
  const aiLogs = useGameStore(state => state.aiLogs);
  const addAILog = useGameStore(state => state.addAILog);
  const setThreatLevel = useGameStore(state => state.setThreatLevel);
  const updateNashResults = useGameStore(state => state.updateNashResults);

  const { recompute } = useNash();
  const { computeNash, simulateAttack: apiAttack, deployDefense: apiDefense } = useGameAPI();

  const [scenario, setScenario] = useState('standard');
  const [topology, setTopology] = useState('star');
  const [aiMode, setAiMode] = useState('rl');
  const [nashData, setNashData] = useState(null);
  const [loading, setLoading] = useState({ nash: false, attack: false, defense: false });
  const [convergenceData, setConvergenceData] = useState([]);
  const [attackResult, setAttackResult] = useState(null);
  const [defenseResult, setDefenseResult] = useState(null);
  const [paretoData, setParetoData] = useState([]);

  // Load Nash on mount / scenario change
  const fetchNash = useCallback(async () => {
    setLoading(l => ({ ...l, nash: true }));
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Computing Nash Equilibrium via Python engine...', color: 'secondary' });
    try {
      const data = await computeNash(payoffMatrix);
      setNashData(data);
      setConvergenceData(data.convergence_data || []);
      // Update strategy probabilities in store
      const attStrategies = ['SQL Injection', 'DDoS Flood', 'Zero-Day Exploit', 'Phishing APT'];
      const defStrategies = ['Firewall', 'Intrusion Det.', 'Patch System', 'Honey Pot'];
      updateNashResults({
        nashData: {
          attackerStrategies: data.attacker_strategy.map((p, i) => ({ id: `A${i+1}`, name: attStrategies[i], prob: Math.round(p * 100) })),
          defenderStrategies: data.defender_strategy.map((p, i) => ({ id: `D${i+1}`, name: defStrategies[i], prob: Math.round(p * 100) })),
          attValue: data.attacker_utility,
          defValue: data.defender_utility,
        },
        paretoData: {}
      });
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Nash computed — v* = ${data.attacker_utility.toFixed(3)} | ${data.attacker_strategy.map((p,i)=>`A${i+1}:${(p*100).toFixed(0)}%`).join(' ')}`, color: 'cyan' });
    } catch {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Backend offline — check that uvicorn is running on port 8000', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, nash: false }));
    }
  }, [payoffMatrix, scenario]);

  useEffect(() => { fetchNash(); }, []);

  const handleAttack = useCallback(async () => {
    setLoading(l => ({ ...l, attack: true }));
    setAttackResult(null);
    simulateAttack(); // optimistic update
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Simulating ${scenario} attack on ${topology} topology...`, color: 'red' });
    try {
      const res = await fetch(`http://localhost:8000/network/simulate-attack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topology_type: topology, attack_type: 'DDoS' }),
      });
      const data = await res.json();
      setAttackResult(data);
      setThreatLevel(Math.min(100, threatLevel + data.severity));
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Attack: ${data.attack_type} → node ${data.attacked_node} | severity ${data.severity} | ${data.status}`, color: 'red' });
    } catch {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Attack simulation complete (backend offline)', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, attack: false }));
    }
  }, [scenario, topology, threatLevel]);

  const handleDefense = useCallback(async () => {
    setLoading(l => ({ ...l, defense: true }));
    setDefenseResult(null);
    deployDefense(); // optimistic update
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Deploying ${aiMode === 'rl' ? 'RL-adaptive' : 'static'} defense on ${topology} topology...`, color: 'green' });
    try {
      const res = await fetch(`http://localhost:8000/network/deploy-defense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topology_type: topology }),
      });
      const data = await res.json();
      setDefenseResult(data);
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Defense deployed → ${data.defended_node} | coverage ${(data.coverage * 100).toFixed(0)}% | ${data.action}`, color: 'green' });
    } catch {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Defense deployed (backend offline)', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, defense: false }));
    }
  }, [aiMode, topology]);

  const gameValue = nashData?.attacker_utility ?? 0;

  return (
    <div className="dashboard-layout">
      <Header />

      {/* Controls Bar */}
      <div className="controls-row">
        <div className="controls-left">
          <ConfigSelect label="Scenario" value={scenario} onChange={setScenario}
            options={[['standard','Standard 4×4'],['zero-sum','Zero-Sum'],['advanced','Advanced APT']]} />
          <ConfigSelect label="Topology" value={topology} onChange={setTopology}
            options={[['star','Star Network'],['mesh','Mesh Network'],['ring','Ring Network']]} />
          <ConfigSelect label="AI Mode" value={aiMode} onChange={setAiMode}
            options={[['rl','Reinforcement Learning'],['static','Static Optimal'],['none','Disabled']]} />
        </div>
        <div className="controls-center">
          <button className="btn btn-cyan" onClick={fetchNash} disabled={loading.nash} id="btn-compute-nash">
            {loading.nash ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Target size={14} />}
            {loading.nash ? 'Computing...' : 'Compute Nash'}
          </button>
          <button className="btn btn-red" onClick={handleAttack} disabled={loading.attack} id="btn-simulate-attack">
            {loading.attack ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Zap size={14} />}
            {loading.attack ? 'Simulating...' : 'Simulate Attack'}
          </button>
          <button className="btn btn-green" onClick={handleDefense} disabled={loading.defense} id="btn-deploy-defense">
            {loading.defense ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Shield size={14} />}
            {loading.defense ? 'Deploying...' : 'Deploy Defense'}
          </button>
        </div>
        <div className="controls-right">
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: nashData ? 'var(--accent-green)' : 'var(--accent-amber)', boxShadow: `0 0 6px ${nashData ? 'var(--accent-green)' : 'var(--accent-amber)'}` }} />
            <span className="font-mono" style={{ fontSize:'0.62rem', color: nashData ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
              {nashData ? `v* = ${gameValue.toFixed(3)}` : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="left-sidebar">
        {/* Strategy Probabilities */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><Cpu size={14} />NASH STRATEGIES</div>
            <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color:'var(--accent-amber)' }}>σ* OPTIMAL</span>
          </div>
          <div style={{ marginBottom:'0.75rem' }}>
            <div className="font-mono" style={{ fontSize:'0.6rem', color:'var(--accent-red)', marginBottom:'0.4rem', letterSpacing:'0.08em' }}>ATTACKER σ*_A</div>
            {attackerStrategies.map((s, i) => (
              <StratBar key={s.id} label={s.id} name={s.name} prob={s.prob} color="var(--accent-red)" />
            ))}
          </div>
          <div>
            <div className="font-mono" style={{ fontSize:'0.6rem', color:'var(--accent-cyan)', marginBottom:'0.4rem', letterSpacing:'0.08em' }}>DEFENDER σ*_D</div>
            {defenderStrategies.map((s, i) => (
              <StratBar key={s.id} label={s.id} name={s.name} prob={s.prob} color="var(--accent-cyan)" />
            ))}
          </div>
        </div>

        {/* Payoff Matrix */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><Target size={14} />PAYOFF MATRIX</div>
            <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>u_A (zero-sum)</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.65rem', fontFamily:'var(--font-mono)' }}>
              <thead>
                <tr>
                  <th style={mth('var(--text-muted)')}></th>
                  {['D1','D2','D3','D4'].map(d => <th key={d} style={mth('var(--accent-cyan)')}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {payoffMatrix.map((row, r) => (
                  <tr key={r}>
                    <td style={mtd}><span style={{ color:'var(--accent-red)' }}>A{r+1}</span></td>
                    {row.map((val, c) => {
                      const isNE = nashData && Math.abs(nashData.attacker_strategy[r]) > 0.01 && Math.abs(nashData.defender_strategy[c]) > 0.01;
                      return (
                        <td key={c} style={{ ...mtd, textAlign:'center',
                          background: isNE ? 'rgba(255,214,10,0.12)' : 'transparent',
                          border: isNE ? '1px solid rgba(255,214,10,0.35)' : '1px solid transparent',
                          borderRadius: 4 }}>
                          <span style={{ color: val > 0 ? 'var(--accent-red)' : val < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: isNE ? 700 : 400 }}>
                            {val > 0 ? `+${val}` : val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nashData && (
            <div style={{ marginTop:'0.5rem', padding:'0.4rem 0.6rem', background:'rgba(255,214,10,0.05)', border:'1px solid rgba(255,214,10,0.2)', borderRadius:5 }}>
              <span className="font-mono" style={{ fontSize:'0.58rem', color:'var(--accent-amber)' }}>
                Game Value v* = {gameValue.toFixed(4)} · {gameValue > 0 ? 'Attacker advantage' : 'Defender advantage'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center Content */}
      <div className="main-content">
        {/* Convergence Chart */}
        <div className="panel" style={{ flex: 1.5 }}>
          <div className="panel-header">
            <div className="panel-title"><TrendingUp size={14} />NASH CONVERGENCE</div>
            <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>Fictitious Play → Equilibrium</span>
          </div>
          <div style={{ flex:1, minHeight:220 }}>
            {convergenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={convergenceData} margin={{ top:5, right:20, left:-25, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="iteration" stroke="var(--text-muted)" tick={{ fontSize:9, fill:'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize:9, fill:'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background:'#0a0e17', border:'1px solid rgba(0,240,255,0.2)', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:11 }} />
                  <ReferenceLine y={gameValue} stroke="var(--accent-amber)" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value:`v*=${gameValue.toFixed(2)}`, position:'right', fill:'var(--accent-amber)', fontSize:9 }} />
                  <Line type="monotone" dataKey="attacker" stroke="var(--accent-red)" strokeWidth={2} dot={false} name="Attacker" />
                  <Line type="monotone" dataKey="defender" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} name="Defender" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.7rem' }}>
                {loading.nash ? '⟳ Computing equilibrium...' : 'Click "Compute Nash" to load convergence data'}
              </div>
            )}
          </div>
        </div>

        {/* Status Cards Row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', flexShrink:0 }}>
          {/* Attack Result */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><AlertTriangle size={14} />LAST ATTACK</div>
              <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color: attackResult ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {attackResult ? '● ACTIVE' : '○ IDLE'}
              </span>
            </div>
            {attackResult ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                <StatRow label="TYPE" value={attackResult.attack_type} color="var(--accent-red)" />
                <StatRow label="TARGET" value={attackResult.attacked_node} color="var(--text-secondary)" />
                <StatRow label="SEVERITY" value={`${attackResult.severity}/100`} color={attackResult.severity > 60 ? 'var(--accent-red)' : 'var(--accent-amber)'} />
                <StatRow label="STATUS" value={attackResult.status?.toUpperCase()} color="var(--accent-amber)" />
                {attackResult.propagation?.length > 0 && (
                  <StatRow label="SPREAD" value={attackResult.propagation.join(' → ')} color="var(--text-muted)" />
                )}
              </div>
            ) : (
              <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.62rem', textAlign:'center', padding:'1rem' }}>
                No attack simulated yet.<br/>Click "Simulate Attack" above.
              </div>
            )}
          </div>

          {/* Defense Result */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><Shield size={14} />LAST DEFENSE</div>
              <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color: defenseResult ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {defenseResult ? '● DEPLOYED' : '○ IDLE'}
              </span>
            </div>
            {defenseResult ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                <StatRow label="NODE" value={defenseResult.defended_node} color="var(--accent-cyan)" />
                <StatRow label="ACTION" value={defenseResult.action} color="var(--accent-green)" />
                <StatRow label="COVERAGE" value={`${(defenseResult.coverage * 100).toFixed(1)}%`} color="var(--accent-green)" />
                <StatRow label="STATUS" value={defenseResult.status?.toUpperCase()} color="var(--accent-green)" />
              </div>
            ) : (
              <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.62rem', textAlign:'center', padding:'1rem' }}>
                No defense deployed yet.<br/>Click "Deploy Defense" above.
              </div>
            )}
          </div>
        </div>

        {/* Threat + Coverage Meters */}
        <div className="panel" style={{ flexShrink:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
            <Meter label="THREAT LEVEL" value={threatLevel} color={threatLevel > 70 ? 'var(--accent-red)' : threatLevel > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
            <Meter label="DEFENSE COVERAGE" value={defenseCoverage} color="var(--accent-cyan)" />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        {/* AI Event Log */}
        <div className="panel" style={{ flex:1 }}>
          <div className="panel-header">
            <div className="panel-title"><Activity size={14} />AI EVENT LOG</div>
            <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color:'var(--accent-green)' }}>● LIVE</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', overflowY:'auto', flex:1 }}>
            {aiLogs.map((log, i) => {
              const colorMap = { cyan:'var(--accent-cyan)', green:'var(--accent-green)', amber:'var(--accent-amber)', red:'var(--accent-red)', secondary:'var(--text-secondary)' };
              return (
                <div key={log.id ?? i} style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:'0.3rem' }}>
                  <span className="font-mono" style={{ fontSize:'0.52rem', color:'var(--text-muted)', whiteSpace:'nowrap', marginTop:1, flexShrink:0 }}>{log.time}</span>
                  <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color: colorMap[log.color] || 'var(--text-secondary)', lineHeight:1.4 }}>{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="panel" style={{ flexShrink:0 }}>
          <div className="panel-header">
            <div className="panel-title"><Cpu size={14} />GAME STATS</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
            <StatRow label="GAME TYPE" value="Zero-Sum 4×4" color="var(--text-secondary)" />
            <StatRow label="ALGORITHM" value="Support Enum." color="var(--accent-cyan)" />
            <StatRow label="GAME VALUE v*" value={nashData ? gameValue.toFixed(4) : '—'} color="var(--accent-amber)" />
            <StatRow label="ATT UTILITY" value={nashData ? nashData.attacker_utility.toFixed(3) : '—'} color="var(--accent-red)" />
            <StatRow label="DEF UTILITY" value={nashData ? nashData.defender_utility.toFixed(3) : '—'} color="var(--accent-cyan)" />
            <StatRow label="BACKEND" value={nashData ? '● ONLINE' : '○ OFFLINE'} color={nashData ? 'var(--accent-green)' : 'var(--accent-amber)'} />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Reusable sub-components ─── */
function StratBar({ label, name, prob, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.35rem' }}>
      <span className="font-mono" style={{ fontSize:'0.55rem', color:'var(--text-muted)', width:18, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:'0.6rem', color:'var(--text-secondary)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</span>
      <div style={{ width:55, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, flexShrink:0 }}>
        <div style={{ width:`${prob}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.5s ease' }} />
      </div>
      <span className="font-mono" style={{ fontSize:'0.55rem', color, width:30, textAlign:'right', flexShrink:0 }}>{prob}%</span>
    </div>
  );
}

function Meter({ label, value, color }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span className="font-mono" style={{ fontSize:'0.58rem', color:'var(--text-muted)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize:'0.58rem', color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ width:'100%', height:6, background:'rgba(255,255,255,0.08)', borderRadius:3 }}>
        <div style={{ width:`${Math.min(100, Math.round(value))}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.5s ease', boxShadow:`0 0 8px ${color}55` }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'0.25rem', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span className="font-mono" style={{ fontSize:'0.56rem', color:'var(--text-muted)' }}>{label}</span>
      <span className="font-mono" style={{ fontSize:'0.62rem', color }}>{value}</span>
    </div>
  );
}

function ConfigSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
      <span className="font-mono" style={{ fontSize:'0.58rem', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background:'var(--bg-base)', border:'1px solid rgba(0,240,255,0.2)', color:'var(--text-primary)', padding:'4px 8px', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:'0.62rem', outline:'none', cursor:'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

const mth = (color) => ({ padding:'4px 6px', fontFamily:'var(--font-mono)', fontSize:'0.58rem', color, textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.07)' });
const mtd = { padding:'5px 6px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle' };
