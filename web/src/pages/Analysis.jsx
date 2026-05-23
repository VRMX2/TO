import { useState, useMemo } from 'react';
import AppLayout from '../components/ui/AppLayout';
import PageHero from '../components/ui/PageHero';
import { Target, RefreshCw, ChevronDown, ChevronUp, Info, Cpu } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useGameStore } from '../store/gameStore';
import { useGameAPI } from '../hooks/useGameAPI';
import BandwidthGame from '../components/BandwidthGame';

/* ─── Pure Nash Equilibrium (saddle point) ─── */
function findPureNash(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const result = [];
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const colMax = Math.max(...matrix.map(row => row[c]));
      const rowMin = Math.min(...matrix[r]);
      if (matrix[r][c] === colMax && matrix[r][c] === rowMin) {
        result.push({ row: r, col: c, value: matrix[r][c] });
      }
    }
  }
  return result;
}

/* ─── Mixed Nash (fictitious play) ─── */
function solveMixedNash(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let p = Array(m).fill(1 / m);
  let q = Array(n).fill(1 / n);
  const lr = 0.04;
  for (let iter = 0; iter < 4000; iter++) {
    const attPay = p.map((_, i) => q.reduce((s, qj, j) => s + qj * matrix[i][j], 0));
    const defPay = q.map((_, j) => p.reduce((s, pi, i) => s + pi * matrix[i][j], 0));
    const avgAtt = p.reduce((s, pi, i) => s + pi * attPay[i], 0);
    const avgDef = q.reduce((s, qj, j) => s + qj * defPay[j], 0);
    p = p.map((pi, i) => Math.max(1e-9, pi + lr * (attPay[i] - avgAtt)));
    q = q.map((qj, j) => Math.max(1e-9, qj - lr * (defPay[j] - avgDef)));
    const sp = p.reduce((a, b) => a + b, 0);
    const sq = q.reduce((a, b) => a + b, 0);
    p = p.map(v => v / sp);
    q = q.map(v => v / sq);
  }
  const gameValue = p.reduce((s, pi, i) => s + q.reduce((ss, qj, j) => ss + pi * qj * matrix[i][j], 0), 0);
  return { p, q, gameValue };
}

/* ─── Pareto Optimal Profiles ─── */
function findPareto(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const profiles = [];
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const att = matrix[r][c];
      const def = -matrix[r][c];
      let dominated = false;
      for (let r2 = 0; r2 < m && !dominated; r2++) {
        for (let c2 = 0; c2 < n && !dominated; c2++) {
          if (r2 === r && c2 === c) continue;
          const att2 = matrix[r2][c2], def2 = -matrix[r2][c2];
          if (att2 >= att && def2 >= def && (att2 > att || def2 > def)) dominated = true;
        }
      }
      if (!dominated) profiles.push({ row: r, col: c, att, def });
    }
  }
  return profiles;
}

/* ─── Price of Anarchy: Network Flow LP & Nash Routing ─── */

const EXAMPLE_NETWORK = [
  { id: 'L1', capacity: 10, latency: 1 },
  { id: 'L2', capacity: 5, latency: 3 },
  { id: 'L3', capacity: 8, latency: 2 },
];

const EXAMPLE_PATHS = [
  { id: 'P1', links: ['L1'], label: 'Fast (L1)' },
  { id: 'P2', links: ['L2'], label: 'Slow (L2)' },
  { id: 'P3', links: ['L1', 'L3'], label: 'Via L3' },
];

function linkLatencyById(id) {
  const link = EXAMPLE_NETWORK.find(l => l.id === id);
  return link ? link.latency : 0;
}

/** Nash routing: each flow splits equally among all paths, scaled by inverse latency */
function computeNashRouting(demand) {
  const invLat = EXAMPLE_PATHS.map(p => {
    const totalLat = p.links.reduce((s, lid) => s + linkLatencyById(lid), 0);
    return totalLat > 0 ? 1 / totalLat : 0;
  });
  const sumInv = invLat.reduce((a, b) => a + b, 0);
  const totalAlloc = Math.min(demand, EXAMPLE_NETWORK.reduce((s, l) => s + l.capacity, 0));
  const flows = EXAMPLE_PATHS.map((_, i) => (invLat[i] / sumInv) * totalAlloc);
  return { flows, totalAlloc };
}

/** LP optimal: max total throughput respecting all link capacities */
function solveLPNetworkFlow(demand) {
  const n = EXAMPLE_PATHS.length;
  const totalCap = EXAMPLE_NETWORK.reduce((s, l) => s + l.capacity, 0);
  const maxDemand = Math.min(demand, totalCap);
  let flows = new Array(n).fill(0);
  let totalFlow = 0;

  // Greedy fill cheapest-latency paths first respecting capacities
  const ordered = EXAMPLE_PATHS.map((p, i) => ({
    idx: i,
    lat: p.links.reduce((s, lid) => s + linkLatencyById(lid), 0),
  })).sort((a, b) => a.lat - b.lat);

  const linkRemaining = EXAMPLE_NETWORK.map(l => l.capacity);

  for (const { idx } of ordered) {
    const pathLinks = EXAMPLE_PATHS[idx].links;
    const pathBottleneck = Math.min(...pathLinks.map(lid => linkRemaining[EXAMPLE_NETWORK.findIndex(l => l.id === lid)]));
    const available = Math.min(pathBottleneck, maxDemand - totalFlow);
    if (available <= 0) break;
    flows[idx] = available;
    totalFlow += available;
    pathLinks.forEach(lid => {
      const li = EXAMPLE_NETWORK.findIndex(l => l.id === lid);
      linkRemaining[li] -= available;
    });
  }

  const welfareLP = totalFlow;
  const welfareNash = computeNashRouting(demand).totalAlloc;
  return { flowsLP: flows, totalFlowLP: welfareLP, totalFlowNash: welfareNash, poa: welfareLP / Math.max(0.001, welfareNash) };
}

const fmt = v => v > 0 ? `+${v}` : `${v}`;
const pct = v => (v * 100).toFixed(1) + '%';

export default function Analysis() {
  const { t } = useI18n();
  const attackerNames = t('common.attackStrategies') || [];
  const defenderNames = t('common.defenseStrategies') || [];
  const matrix = useGameStore(state => state.payoffMatrix);
  const setMatrix = useGameStore(state => state.setPayoffMatrix);
  const { solveLP } = useGameAPI();
  const [lpResult, setLpResult] = useState(null);
  const [lpLoading, setLpLoading] = useState(false);
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [showInfo, setShowInfo] = useState({ pure: true, mixed: true, pareto: true });
  const [manualP, setManualP] = useState(null);
  const [manualQ, setManualQ] = useState(null);
  const [demand, setDemand] = useState(20);
  const [activeModel, setActiveModel] = useState('congestion');

  const computed = solveMixedNash(matrix);
  const pureNash = findPureNash(matrix);
  const pareto = findPareto(matrix);

  const p = manualP || computed.p;
  const q = manualQ || computed.q;
  const gameValue = computed.gameValue;

  const poaResult = useMemo(() => solveLPNetworkFlow(demand), [demand]);

  const isPure = (r, c) => pureNash.some(n => n.row === r && n.col === c);
  const isPareto = (r, c) => pareto.some(pp => pp.row === r && pp.col === c);

  const defBR = matrix.map(row => { const m = Math.min(...row); return row.map(v => v === m); });
  const attBR = matrix.map((row, _r) => row.map((val, c) => { const m = Math.max(...matrix.map(rr => rr[c])); return val === m; }));

  const setProb = (type, idx, val) => {
    const arr = type === 'p' ? [...(manualP || computed.p)] : [...(manualQ || computed.q)];
    arr[idx] = val;
    const sum = arr.reduce((a, b) => a + b, 0);
    const normalized = arr.map(v => sum > 0 ? v / sum : 1 / arr.length);
    if (type === 'p') setManualP(normalized); else setManualQ(normalized);
  };

  const resetManual = () => { setManualP(null); setManualQ(null); };

  const handleCellClick = (r, c) => { setEditCell({ r, c }); setEditVal(String(matrix[r][c])); };

  const commitEdit = () => {
    if (!editCell) return;
    const v = parseFloat(editVal);
    if (!isNaN(v)) {
      const m = matrix.map(row => [...row]);
      m[editCell.r][editCell.c] = v;
      setMatrix(m);
    }
    setEditCell(null);
  };

  const randomize = () => setMatrix(Array.from({ length: matrix.length }, () =>
    Array.from({ length: matrix[0].length }, () => Math.floor(Math.random() * 17) - 5)));

  const reset = () => setMatrix(matrix.map((row, r) => row.map((_, c) => {
    const defaults = [[5, 2, -1, 4], [4, 6, 8, 3], [-3, 1, 7, 2], [2, -2, 5, 0]];
    return (defaults[r] && defaults[r][c] != null) ? defaults[r][c] : 0;
  })));
  const toggle = k => setShowInfo(s => ({ ...s, [k]: !s[k] }));

  return (
    <AppLayout wide>
      <div className="page-transition delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.75rem' }}>
        <PageHero
          icon={Target}
          title={t('analysis.title')}
          subtitle={t('analysis.subtitle')}
          actions={
            <>
              <button type="button" className="btn btn-cyan" onClick={randomize}>
                <RefreshCw size={12} /> {t('analysis.randomize')}
              </button>
              <button type="button" className="btn btn-amber" onClick={reset}>
                {t('analysis.reset')}
              </button>
            </>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* LEFT COLUMN */}
          <div className="page-transition delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Payoff Matrix */}
            <Panel color="cyan" title={t('analysis.payoffMatrix')} subtitle={t('analysis.payoffSubtitle')}>
              <p className="text-muted font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.75rem' }}>
                {t('analysis.payoffHelp')}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, textAlign: 'left', color: 'var(--text-muted)', width: 110, fontSize: '0.58rem' }}>ATT \ DEF →</th>
                      {defenderNames.map((d, j) => (
                        <th key={j} style={{ ...TH, color: 'var(--accent-cyan)' }}>
                          D{j + 1}<br /><span style={{ fontSize: '0.52rem', fontWeight: 400, color: 'var(--text-muted)' }}>{d}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, r) => (
                      <tr key={r}>
                        <td style={{ ...TH, textAlign: 'left', color: 'var(--accent-red)', padding: '4px 6px' }}>
                          A{r + 1} <span style={{ fontSize: '0.52rem', fontWeight: 400, color: 'var(--text-muted)' }}>{attackerNames[r]}</span>
                        </td>
                        {row.map((val, c) => {
                          const pure = isPure(r, c), pare = isPareto(r, c);
                          const editing = editCell?.r === r && editCell?.c === c;
                          let bg = val > 0 ? 'rgba(0,240,255,0.07)' : val < 0 ? 'rgba(255,59,48,0.07)' : 'rgba(255,255,255,0.02)';
                          let border = val > 0 ? '1px solid rgba(0,240,255,0.2)' : val < 0 ? '1px solid rgba(255,59,48,0.2)' : '1px solid rgba(255,255,255,0.08)';
                          let color = val > 0 ? 'var(--accent-cyan)' : val < 0 ? 'var(--accent-red)' : 'var(--text-primary)';
                          if (pure) { bg = 'rgba(255,214,10,0.14)'; border = '2px solid var(--accent-amber)'; color = 'var(--accent-amber)'; }
                          else if (pare) { bg = 'rgba(0,255,102,0.09)'; border = '1px solid rgba(0,255,102,0.4)'; }
                          return (
                            <td key={c} onClick={() => handleCellClick(r, c)}
                              style={{ background: bg, border, color, borderRadius: 5, textAlign: 'center', padding: '8px 4px', position: 'relative', cursor: 'pointer', minWidth: 58 }}>
                              {editing ? (
                                <input autoFocus value={editVal}
                                  onChange={e => setEditVal(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditCell(null); }}
                                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'inherit', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
                                />
                              ) : (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: pure ? 700 : 400 }}>{fmt(val)}</span>
                              )}
                              {pure && <span style={{ position: 'absolute', top: 1, right: 3, fontSize: '0.48rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>NE</span>}
                              {pare && !pure && <span style={{ position: 'absolute', top: 1, right: 3, fontSize: '0.48rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>PO</span>}
                              {defBR[r][c] && !pure && <span style={{ position: 'absolute', bottom: 1, left: 3, fontSize: '0.45rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>D</span>}
                              {attBR[r][c] && !pure && <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: '0.45rem', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>A</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
                {[['var(--accent-amber)', t('analysis.legendNE')], ['var(--accent-green)', t('analysis.legendPO')], ['var(--accent-cyan)', 'D  Defender BR (row min)'], ['var(--accent-red)', 'A  Attacker BR (col max)']].map(([clr, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, background: clr, borderRadius: 1 }} />{lbl}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Mixed Strategy Probabilities */}
            <Panel color="amber" title={t('analysis.mixedProb')}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setManualP(null)} style={{ ...tinyBtn, color: 'var(--accent-red)', borderColor: 'rgba(255,59,48,0.4)' }}>RESET σ_A</button>
                <button onClick={() => setManualQ(null)} style={{ ...tinyBtn, color: 'var(--accent-cyan)', borderColor: 'rgba(0,240,255,0.4)' }}>RESET σ_D</button>
                <button onClick={resetManual} style={{ ...tinyBtn, color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.15)' }}>RESET BOTH</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-red font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{t('analysis.attackerSigma')} {manualP && <span style={{ color: 'var(--accent-amber)', fontSize: '0.52rem' }}>(MANUAL)</span>}</div>
                  {p.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                      <span className="font-mono" style={{ width: 20, fontSize: '0.62rem', color: 'var(--text-muted)' }}>A{i + 1}</span>
                      <input type="range" min={0} max={1} step={0.01} value={prob}
                        onChange={e => setProb('p', i, parseFloat(e.target.value))}
                        style={{ flex: 1, height: 4, accentColor: 'var(--accent-red)', cursor: 'pointer' }} />
                      <span className="font-mono" style={{ width: 38, fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{pct(prob)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-cyan font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{t('analysis.defenderSigma')} {manualQ && <span style={{ color: 'var(--accent-amber)', fontSize: '0.52rem' }}>(MANUAL)</span>}</div>
                  {q.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                      <span className="font-mono" style={{ width: 20, fontSize: '0.62rem', color: 'var(--text-muted)' }}>D{i + 1}</span>
                      <input type="range" min={0} max={1} step={0.01} value={prob}
                        onChange={e => setProb('q', i, parseFloat(e.target.value))}
                        style={{ flex: 1, height: 4, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} />
                      <span className="font-mono" style={{ width: 38, fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{pct(prob)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[[t('analysis.gameValueLabel'), gameValue.toFixed(4), 'var(--accent-amber)'], [t('analysis.attUtilLabel'), gameValue.toFixed(4), 'var(--accent-red)'], [t('analysis.defUtilLabel'), (-gameValue).toFixed(4), 'var(--accent-cyan)']].map(([lbl, val, clr]) => (
                  <div key={lbl} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', color: clr, lineHeight: 1 }}>{val}</div>
                    <div className="text-muted font-mono" style={{ fontSize: '0.52rem', marginTop: 4 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Pure Nash Table */}
            <Panel color="amber" title={t('analysis.pureTitle')} badge={pureNash.length === 0 ? t('analysis.noneFound') : `${pureNash.length} ${t('analysis.found')}`}>
              <Collapse open={showInfo.pure} onToggle={() => toggle('pure')}>
                <strong>How to find it — mutual best-response:</strong><br />
                ① <strong>Defender's turn:</strong> Fix each A_r, pick the defense that minimizes attacker's gain (smallest value in that row) → marked <span style={{ color: 'var(--accent-cyan)' }}>D</span>.<br />
                ② <strong>Attacker's turn:</strong> Fix each D_c, pick the attack that maximizes their gain (largest value in that column) → marked <span style={{ color: 'var(--accent-red)' }}>A</span>.<br />
                ③ <strong>Pure Nash:</strong> The cell where both chose each other (marked <span style={{ color: 'var(--accent-amber)' }}>NE</span>) — neither player can improve by changing alone.
              </Collapse>
              {pureNash.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,214,10,0.25)', borderRadius: 6 }}>
                  <p className="text-amber font-mono" style={{ fontSize: '0.72rem', margin: 0 }}>{t('analysis.noPure')}</p>
                  <p className="text-muted" style={{ fontSize: '0.62rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                    {t('analysis.noPureHelp').split('\n')[0]}<br />{t('analysis.noPureHelp').split('\n')[1]}
                  </p>
                </div>
              ) : (
                <table style={{ ...TBLST, marginTop: 0 }}>
                  <thead>
                    <tr>{t('analysis.pureHeaders').map((h) => <th key={h} style={THEAD}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pureNash.map((ne, i) => {
                      const colVals = matrix.map(row => row[ne.col]);
                      const rowVals = matrix[ne.row];
                      const isColMax = ne.value === Math.max(...colVals);
                      const isRowMin = ne.value === Math.min(...rowVals);
                      return (
                        <tr key={i} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                          <td style={TD}><span className="font-mono" style={{ color: 'var(--accent-amber)', fontSize: '0.72rem' }}>(A{ne.row + 1},D{ne.col + 1})</span></td>
                          <td style={TD}><span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>{attackerNames[ne.row]}</span></td>
                          <td style={TD}><span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{defenderNames[ne.col]}</span></td>
                          <td style={TD}><span className="font-mono" style={{ color: 'var(--accent-amber)' }}>{fmt(ne.value)}</span></td>
                          <td style={TD}><Pill color={isColMax ? 'green' : 'red'}>{isColMax ? t('analysis.yes') : t('analysis.no')}</Pill></td>
                          <td style={TD}><Pill color={isRowMin ? 'green' : 'red'}>{isRowMin ? t('analysis.yes') : t('analysis.no')}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>

            {/* LP Centralized Optimization */}
            <Panel color="purple" title="LP CENTRALIZED OPT." badge={lpResult ? `v* = ${lpResult.game_value}` : ''}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-cyan" onClick={async () => {
                  setLpLoading(true);
                  try {
                    const res = await solveLP(matrix);
                    setLpResult(res);
                  } catch { setLpResult(null); }
                  setLpLoading(false);
                }} disabled={lpLoading}>
                  <Cpu size={12} /> {lpLoading ? 'Solving...' : 'Solve via LP'}
                </button>
                {lpResult && <span className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--accent-green)' }}>Status: {lpResult.status}</span>}
              </div>
              {lpResult && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="font-mono text-red" style={{ fontSize: '0.55rem', marginBottom: '0.3rem' }}>Optimal Attacker σ*</div>
                    {lpResult.optimal_attacker_strategy.map((prob, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.25rem' }}>
                        <span className="font-mono text-muted" style={{ width: 18, fontSize: '0.55rem' }}>A{i + 1}</span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                          <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-red)', borderRadius: 2 }} />
                        </div>
                        <span className="font-mono" style={{ width: 35, fontSize: '0.55rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-mono text-cyan" style={{ fontSize: '0.55rem', marginBottom: '0.3rem' }}>Optimal Defender σ*</div>
                    {lpResult.optimal_defender_strategy.map((prob, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.25rem' }}>
                        <span className="font-mono text-muted" style={{ width: 18, fontSize: '0.55rem' }}>D{i + 1}</span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                          <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
                        </div>
                        <span className="font-mono" style={{ width: 35, fontSize: '0.55rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!lpResult && (
                <div className="font-mono text-muted" style={{ fontSize: '0.6rem', textAlign: 'center', padding: '0.5rem' }}>
                  Click "Solve via LP" to compare with support enumeration
                </div>
              )}
            </Panel>

            {/* Nash vs LP Comparison */}
            {lpResult && (
              <Panel color="green" title="NASH vs LP COMPARISON" badge={Number(Math.abs(lpResult.game_value - gameValue)).toFixed(4) === '0.0000' ? 'MINIMAX THEOREM' : 'GAP DETECTED'}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,59,48,0.06)', borderRadius: 6, border: '1px solid rgba(255,59,48,0.15)' }}>
                    <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>Nash v*</div>
                    <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-red)' }}>{gameValue.toFixed(4)}</span>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(0,240,255,0.06)', borderRadius: 6, border: '1px solid rgba(0,240,255,0.15)' }}>
                    <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>LP Optimal v*</div>
                    <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>{(lpResult.game_value || 0).toFixed(4)}</span>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,214,10,0.06)', borderRadius: 6, border: '1px solid rgba(255,214,10,0.15)' }}>
                    <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>Price of Anarchy</div>
                    <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>
                      {(lpResult.game_value / Math.max(0.001, gameValue)).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Attacker strategies side by side */}
                <div style={{ marginBottom: '0.4rem' }}>
                  <div className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>Attacker σ* — Nash vs LP</div>
                  {computed.p.map((prob, i) => {
                    const lpProb = (lpResult.optimal_attacker_strategy || [])[i] || 0;
                    const diff = Math.abs(prob - lpProb);
                    return (
                      <div key={i} style={{ marginBottom: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>
                          <span>A{i + 1}</span>
                          <span>Nash: {(prob * 100).toFixed(1)}% · LP: {(lpProb * 100).toFixed(1)}% · Δ: {(diff * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, height: 6 }}>
                          <div style={{ flex: prob, background: 'var(--accent-red)', borderRadius: 2, opacity: 0.7, minWidth: prob > 0 ? 2 : 0, transition: 'flex 0.3s' }} />
                          <div style={{ flex: lpProb, background: 'var(--accent-cyan)', borderRadius: 2, opacity: 0.7, minWidth: lpProb > 0 ? 2 : 0, transition: 'flex 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Defender strategies side by side */}
                <div>
                  <div className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Defender σ* — Nash vs LP</div>
                  {computed.q.map((prob, i) => {
                    const lpProb = (lpResult.optimal_defender_strategy || [])[i] || 0;
                    const diff = Math.abs(prob - lpProb);
                    return (
                      <div key={i} style={{ marginBottom: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>
                          <span>D{i + 1}</span>
                          <span>Nash: {(prob * 100).toFixed(1)}% · LP: {(lpProb * 100).toFixed(1)}% · Δ: {(diff * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, height: 6 }}>
                          <div style={{ flex: prob, background: 'var(--accent-red)', borderRadius: 2, opacity: 0.7, minWidth: prob > 0 ? 2 : 0, transition: 'flex 0.3s' }} />
                          <div style={{ flex: lpProb, background: 'var(--accent-cyan)', borderRadius: 2, opacity: 0.7, minWidth: lpProb > 0 ? 2 : 0, transition: 'flex 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Network Game Models */}
            <Panel color="amber" title="NETWORK GAME MODELS">
              {(() => {
                const models = {
                  congestion: {
                    label: 'Congestion Control',
                    desc: 'Row = path chosen by flow. Col = traffic level set by network. Payoff = -delay. Player wants to minimize delay (maximize negative). Pure Nash = Wardrop equilibrium — all used paths have equal minimal delay.',
                    long: [
                      'Path A / Low traffic: −5 (lowest delay, best for player)',
                      'Path A / High traffic: −8 (congestion, high delay)',
                      'Path B / Low traffic: −6 (slightly worse than Path A)',
                      'Path B / High traffic: −3 (unusual: Path B handles load better)',
                      'Pure NE at (B, High) since −3 is column max (attacker) and row min (defender).',
                    ],
                    matrix: [[-5, -8], [-6, -3]],
                    rows: ['Path A', 'Path B'], cols: ['Low traffic', 'High traffic'],
                  },
                  routing: {
                    label: 'Routing',
                    desc: 'Row = route chosen by source node. Col = link condition set by environment. Payoff = throughput (higher is better). Mixed Nash = randomized routing to avoid predictability.',
                    long: [
                      'Route A / Short path: +4 (fast direct route when available)',
                      'Route A / Reliable path: +1 (A is slow on reliable links)',
                      'Route B / Short path: +2 (B is moderately fast on short)',
                      'Route B / Reliable path: +3 (B keeps good throughput on reliable links)',
                      'No pure NE — player randomizes between A (short) and B (reliable).',
                    ],
                    matrix: [[4, 1], [2, 3]],
                    rows: ['Route A', 'Route B'], cols: ['Short path', 'Reliable path'],
                  },
                  bandwidth: {
                    label: 'Bandwidth Allocation',
                    desc: 'Row = bandwidth request size. Col = network admission decision. Payoff = utility (throughput satisfaction) − cost of request. Nash = fair bandwidth share under congestion.',
                    long: [
                      'High req. / Allocated: +3 (gets what it wants, high utility)',
                      'High req. / Rejected: 0 (wasted request, zero payoff)',
                      'Low req. / Allocated: 0 (gets less than needed, utility = cost)',
                      'Low req. / Rejected: +2 (conservative request saved energy)',
                      'Pure NE at (High, Allocated): +3 column max AND row min.',
                    ],
                    matrix: [[3, 0], [0, 2]],
                    rows: ['High req.', 'Low req.'], cols: ['Allocated', 'Rejected'],
                  },
                  spectrum: {
                    label: 'Spectrum Auction',
                    desc: 'Row = bid level. Col = auction outcome. Payoff = revenue from won spectrum − bid price. Nash = equilibrium bid in a sealed-bid auction (FCC-style).',
                    long: [
                      'Bid high / Win band: +2 (wins spectrum at high cost, net small profit)',
                      'Bid high / Lose band: −1 (paid bid but got nothing)',
                      'Bid low / Win band: −3 (wins by chance but capacity insufficient, negative profit)',
                      'Bid low / Lose band: +4 (kept budget, no loss)',
                      'Pure NE at (High, Win): +2 — both mutual best-response.',
                    ],
                    matrix: [[2, -1], [-3, 4]],
                    rows: ['Bid high', 'Bid low'], cols: ['Win band', 'Lose band'],
                  },
                  coalition: {
                    label: 'Coalition Formation',
                    desc: 'Row = sensor node strategy (join or defect from coalition). Col = other nodes\' collective behavior. Payoff = energy saved by cooperative data fusion minus communication overhead.',
                    long: [
                      'Join / Cooperate: +5 (everyone shares data, max energy saving)',
                      'Join / Compete: +2 (node shares but others compete, modest saving)',
                      'Defect / Cooperate: +3 (free-ride on others\' data, some saving)',
                      'Defect / Compete: +6 (no sharing overhead, best individual payoff)',
                      'BUT if everyone defects, system collapses — Pareto optimal is (Join, Cooperate).',
                    ],
                    matrix: [[5, 2], [3, 6]],
                    rows: ['Join', 'Defect'], cols: ['Cooperate', 'Compete'],
                  },
                };
                const m = models[activeModel];
                return (
                  <div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(models).map(([k, v]) => (
                        <button key={k} onClick={() => setActiveModel(k)}
                          style={{ padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.52rem', cursor: 'pointer', background: activeModel === k ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeModel === k ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: activeModel === k ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <p className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{m.desc}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '2px 6px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}></th>
                          {m.cols.map((c, i) => <th key={i} style={{ padding: '2px 6px', color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {m.matrix.map((row, r) => (
                          <tr key={r}>
                            <td style={{ padding: '2px 6px', color: 'var(--accent-red)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.rows[r]}</td>
                            {row.map((v, c) => (
                              <td key={c} style={{ padding: '2px 6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <span className="font-mono" style={{ color: v > 0 ? 'var(--accent-cyan)' : v < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>{v > 0 ? `+${v}` : v}</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {m.long.map((line, i) => (
                        <span key={i} className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>• {line}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Panel>

            {/* Price of Anarchy */}
            <Panel color="green" title="PRICE OF ANARCHY" badge={`PoA = ${poaResult.poa.toFixed(3)}`}>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className="font-mono text-muted" style={{ fontSize: '0.55rem' }}>Total Demand</span>
                  <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{demand} units</span>
                </div>
                <input type="range" min={1} max={50} value={demand} onChange={e => setDemand(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-green)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,59,48,0.06)', borderRadius: 6, border: '1px solid rgba(255,59,48,0.15)' }}>
                  <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>Nash Welfare</div>
                  <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-red)' }}>{poaResult.totalFlowNash.toFixed(1)}</span>
                </div>
                <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(0,240,255,0.06)', borderRadius: 6, border: '1px solid rgba(0,240,255,0.15)' }}>
                  <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>LP Optimal</div>
                  <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>{poaResult.totalFlowLP.toFixed(1)}</span>
                </div>
                <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,214,10,0.06)', borderRadius: 6, border: '1px solid rgba(255,214,10,0.15)' }}>
                  <div className="font-mono text-muted" style={{ fontSize: '0.5rem', marginBottom: 2 }}>Price of Anarchy</div>
                  <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>{poaResult.poa.toFixed(3)}</span>
                </div>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <div className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Network Topology</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {EXAMPLE_NETWORK.map(l => (
                    <div key={l.id} style={{ padding: '0.2rem 0.5rem', background: 'rgba(0,240,255,0.06)', borderRadius: 4, border: '1px solid rgba(0,240,255,0.15)', fontSize: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      {l.id}: cap={l.capacity} lat={l.latency}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Path Flow Allocation</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.55rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '3px 6px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', letterSpacing: '0.06em' }}>Path</th>
                      <th style={{ padding: '3px 6px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', letterSpacing: '0.06em' }}>Nash</th>
                      <th style={{ padding: '3px 6px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', letterSpacing: '0.06em' }}>LP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE_PATHS.map((path, i) => {
                      const nf = computeNashRouting(demand).flows[i];
                      const lf = poaResult.flowsLP[i];
                      return (
                        <tr key={path.id}>
                          <td style={{ padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)' }}>{path.label}</td>
                          <td style={{ padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{nf.toFixed(1)}</td>
                          <td style={{ padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{lf.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

          </div>

          {/* RIGHT COLUMN */}
          <div className="page-transition delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Mixed Nash Table */}
            <Panel color="cyan" title={t('analysis.mixedTitle')} badge={t('analysis.mixedBadge')}>
              <Collapse open={showInfo.mixed} onToggle={() => toggle('mixed')}>
                <span dangerouslySetInnerHTML={{ __html: t('analysis.mixedTheory') }} />
              </Collapse>
              <table style={TBLST}>
                <thead>
                  <tr>{t('analysis.mixedHeaders').map((h) => <th key={h} style={THEAD}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr><td colSpan={5} style={{ ...TD, color: 'var(--accent-red)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', paddingTop: '0.6rem', paddingBottom: 2 }}>{t('analysis.attackerMixedBand')}</td></tr>
                  {p.map((prob, i) => {
                    const expPay = q.reduce((s, qj, j) => s + qj * matrix[i][j], 0);
                    const inSupport = prob > 0.01;
                    return (
                      <tr key={`a${i}`} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono text-red" style={{ fontSize: '0.72rem' }}>A{i + 1}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{attackerNames[i]}</span></td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-red)', borderRadius: 2, transition: 'width 0.5s' }} />
                            </div>
                            <span className="font-mono" style={{ fontSize: '0.68rem' }}>{pct(prob)}</span>
                          </div>
                        </td>
                        <td style={TD}><Pill color={inSupport ? 'red' : 'muted'}>{inSupport ? t('analysis.support') : t('analysis.excluded')}</Pill></td>
                        <td style={TD}><span className="font-mono" style={{ fontSize: '0.68rem', color: expPay > gameValue ? 'var(--accent-green)' : 'var(--text-muted)' }}>{expPay.toFixed(3)}</span></td>
                      </tr>
                    );
                  })}
                  <tr><td colSpan={5} style={{ ...TD, color: 'var(--accent-cyan)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', paddingTop: '0.6rem', paddingBottom: 2 }}>{t('analysis.defenderMixedBand')}</td></tr>
                  {q.map((prob, i) => {
                    const expPay = p.reduce((s, pi, r) => s + pi * matrix[r][i], 0);
                    const inSupport = prob > 0.01;
                    return (
                      <tr key={`d${i}`} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono text-cyan" style={{ fontSize: '0.72rem' }}>D{i + 1}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{defenderNames[i]}</span></td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2, transition: 'width 0.5s' }} />
                            </div>
                            <span className="font-mono" style={{ fontSize: '0.68rem' }}>{pct(prob)}</span>
                          </div>
                        </td>
                        <td style={TD}><Pill color={inSupport ? 'cyan' : 'muted'}>{inSupport ? t('analysis.support') : t('analysis.excluded')}</Pill></td>
                        <td style={TD}><span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{expPay.toFixed(3)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 6 }}>
                <span className="font-mono text-secondary" style={{ fontSize: '0.62rem' }}>
                  {t('analysis.minimax')}&nbsp;
                  <span className="text-amber" style={{ fontSize: '0.8rem' }}>v* = {gameValue.toFixed(4)}</span>
                  &nbsp;— {t('analysis.minimaxHint')}
                </span>
              </div>
            </Panel>

            {/* Pareto Table */}
            <Panel color="green" title={t('analysis.paretoTitle')} badge={t('analysis.profilesBadge', { count: pareto.length })}>
              <Collapse open={showInfo.pareto} onToggle={() => toggle('pareto')}>
                <span dangerouslySetInnerHTML={{ __html: t('analysis.paretoTheory') }} />
              </Collapse>
              <table style={TBLST}>
                <thead>
                  <tr>{t('analysis.paretoHeaders').map((h) => <th key={h} style={THEAD}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {pareto.map((pp, i) => {
                    const isNash = isPure(pp.row, pp.col);
                    return (
                      <tr key={i} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono" style={{ color: 'var(--accent-green)', fontSize: '0.72rem' }}>(A{pp.row + 1},D{pp.col + 1})</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{attackerNames[pp.row]}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{defenderNames[pp.col]}</span></td>
                        <td style={TD}><span className="font-mono" style={{ color: pp.att >= 0 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontSize: '0.72rem' }}>{fmt(pp.att)}</span></td>
                        <td style={TD}><span className="font-mono" style={{ color: pp.def >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)', fontSize: '0.72rem' }}>{fmt(pp.def)}</span></td>
                        <td style={TD}><Pill color={isNash ? 'amber' : 'muted'}>{isNash ? `★ ${t('analysis.yes')}` : t('analysis.no')}</Pill></td>
                        <td style={TD}><Pill color="green">{t('analysis.nonDom')}</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(0,255,102,0.04)', border: '1px solid rgba(0,255,102,0.15)', borderRadius: 6 }}>
                <span className="font-mono text-secondary" style={{ fontSize: '0.62rem' }}>
                  {pareto.length} {t('analysis.paretoSummary')} {pureNash.length > 0
                    ? t('analysis.paretoFooterWithPure').replace('{{profiles}}', pureNash.map(n => `(A${n.row + 1},D${n.col + 1})`).join(', '))
                    : t('analysis.paretoFooterNoPure')}
                </span>
              </div>
            </Panel>

            <BandwidthGame />

          </div>

        </div>
      </div>
    </AppLayout>
  );
}

/* ── Reusable sub-components ── */
function Panel({ color, title, subtitle, badge, children }) {
  const accent = { cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)' }[color] || 'var(--border-subtle)';
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.9))',
      border: `1px solid ${accent}30`,
      borderTop: `2px solid ${accent}60`,
      borderRadius: 12,
      padding: '1.25rem',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: `0 10px 40px rgba(0,0,0,0.4), 0 0 0 0 ${accent}, inset 0 1px 1px rgba(255,255,255,0.05)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)', pointerEvents: 'none', borderRadius: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.72rem', color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{title}</span>
          {subtitle && <p className="text-muted" style={{ fontSize: '0.58rem', margin: 0, marginTop: 3 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ background: `${accent}18`, border: `1px solid ${accent}40`, color: accent, padding: '2px 8px', borderRadius: 12, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Collapse({ open, onToggle, children }) {
  return (
    <div style={{ marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', padding: '7px 10px', color: 'var(--text-muted)', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', transition: 'background 0.2s ease' }}>
        <Info size={10} /> THEORY & DEFINITION {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {open && <div style={{ padding: '0.75rem 1rem', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{children}</div>}
    </div>
  );
}

function Pill({ color, children }) {
  const m = {
    amber: ['rgba(255,214,10,0.12)', 'rgba(255,214,10,0.4)', 'var(--accent-amber)'],
    cyan: ['rgba(0,240,255,0.12)', 'rgba(0,240,255,0.4)', 'var(--accent-cyan)'],
    red: ['rgba(255,59,48,0.12)', 'rgba(255,59,48,0.4)', 'var(--accent-red)'],
    green: ['rgba(0,255,102,0.12)', 'rgba(0,255,102,0.4)', 'var(--accent-green)'],
    muted: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.15)', 'var(--text-muted)'],
  };
  const [bg, border, fg] = m[color] || m.muted;
  return <span style={{ background: bg, border: `1px solid ${border}`, color: fg, padding: '2px 7px', borderRadius: 20, fontSize: '0.55rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{children}</span>;
}

const TBLST = { width: '100%', borderCollapse: 'collapse' };
const THEAD = { padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', letterSpacing: '0.06em', textTransform: 'uppercase' };
const TD = { padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
const TH = { fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '5px 6px', letterSpacing: '0.05em', textAlign: 'center', fontSize: '0.68rem' };
const tinyBtn = { background: 'transparent', border: '1px solid', borderRadius: 3, padding: '2px 7px', cursor: 'pointer', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' };