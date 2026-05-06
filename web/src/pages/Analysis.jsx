import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import { Target, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

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

const DEFAULT_MATRIX = [
  [5, 2, -1, 4],
  [4, 6, 8, 3],
  [-3, 1, 7, 2],
  [2, -2, 5, 0],
];

const fmt = v => v > 0 ? `+${v}` : `${v}`;
const pct = v => (v * 100).toFixed(1) + '%';

export default function Analysis() {
  const { t } = useI18n();
  const attackerNames = t('common.attackStrategies') || [];
  const defenderNames = t('common.defenseStrategies') || [];
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX.map(r => [...r]));
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [showInfo, setShowInfo] = useState({ pure: true, mixed: true, pareto: true });

  const pureNash = findPureNash(matrix);
  const { p, q, gameValue } = solveMixedNash(matrix);
  const pareto = findPareto(matrix);

  const isPure = (r, c) => pureNash.some(n => n.row === r && n.col === c);
  const isPareto = (r, c) => pareto.some(pp => pp.row === r && pp.col === c);

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

  const randomize = () => setMatrix(Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 17) - 5)));

  const reset = () => setMatrix(DEFAULT_MATRIX.map(r => [...r]));
  const toggle = k => setShowInfo(s => ({ ...s, [k]: !s[k] }));

  const borderFor = color => ({
    cyan: 'rgba(0,240,255,0.3)', amber: 'rgba(255,214,10,0.3)', green: 'rgba(0,255,102,0.3)'
  }[color] || 'rgba(255,255,255,0.1)');

  const labelFor = color => ({
    cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)'
  }[color] || 'var(--text-secondary)');

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="main-content" style={{ gridColumn: '1 / -1', padding: '1.5rem', overflowY: 'auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={22} className="text-cyan" />
            <div>
              <h2 className="text-primary font-mono" style={{ fontSize: '1rem', margin: 0, letterSpacing: '0.1em' }}>{t('analysis.title')}</h2>
              <p className="text-secondary" style={{ fontSize: '0.72rem', margin: 0, marginTop: 2 }}>{t('analysis.subtitle')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={randomize} style={btnSt('rgba(0,240,255,0.1)', 'var(--accent-cyan)')}>
              <RefreshCw size={11} /> {t('analysis.randomize')}
            </button>
            <button onClick={reset} style={btnSt('rgba(255,255,255,0.05)', 'var(--text-muted)')}>{t('analysis.reset')}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

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
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
                {[['var(--accent-amber)', t('analysis.legendNE')], ['var(--accent-green)', t('analysis.legendPO')], ['var(--accent-cyan)', t('analysis.legendGain')], ['var(--accent-red)', t('analysis.legendLoss')]].map(([clr, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, background: clr, borderRadius: 1 }} />{lbl}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Mixed Strategy Probabilities */}
            <Panel color="amber" title={t('analysis.mixedProb')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-red font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{t('analysis.attackerSigma')}</div>
                  {p.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                      <span className="font-mono" style={{ width: 20, fontSize: '0.62rem', color: 'var(--text-muted)' }}>A{i + 1}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-red)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                      <span className="font-mono" style={{ width: 38, fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{pct(prob)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-cyan font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{t('analysis.defenderSigma')}</div>
                  {q.map((prob, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                      <span className="font-mono" style={{ width: 20, fontSize: '0.62rem', color: 'var(--text-muted)' }}>D{i + 1}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
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
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Pure Nash Table */}
            <Panel color="amber" title={t('analysis.pureTitle')} badge={pureNash.length === 0 ? t('analysis.noneFound') : `${pureNash.length} ${t('analysis.found')}`}>
              <Collapse open={showInfo.pure} onToggle={() => toggle('pure')}>
                <span dangerouslySetInnerHTML={{ __html: t('analysis.pureTheory') }} />
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
                    const dominated = matrix.flat().some(v => v > pp.att) ? t('analysis.checkLp') : t('analysis.frontier');
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

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */
function Panel({ color, title, subtitle, badge, children }) {
  const accent = { cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)' }[color] || 'var(--border-subtle)';
  return (
    <div style={{ background: 'var(--bg-panel)', border: `1px solid ${accent}28`, borderRadius: 8, padding: '1rem', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${accent}18` }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.7rem', color: accent, letterSpacing: '0.08em' }}>{title}</span>
          {subtitle && <p className="text-muted" style={{ fontSize: '0.58rem', margin: 0, marginTop: 2 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ background: `${accent}18`, border: `1px solid ${accent}45`, color: accent, padding: '2px 7px', borderRadius: 4, fontSize: '0.58rem', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Collapse({ open, onToggle, children }) {
  return (
    <div style={{ marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', padding: '5px 8px', color: 'var(--text-muted)', fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
        <Info size={10} /> THEORY & DEFINITION {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {open && <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.75, fontFamily: 'var(--font-mono)' }}>{children}</div>}
    </div>
  );
}

function Pill({ color, children }) {
  const m = { amber: ['rgba(255,214,10,0.15)', 'var(--accent-amber)'], cyan: ['rgba(0,240,255,0.15)', 'var(--accent-cyan)'], red: ['rgba(255,59,48,0.15)', 'var(--accent-red)'], green: ['rgba(0,255,102,0.15)', 'var(--accent-green)'], muted: ['rgba(255,255,255,0.06)', 'var(--text-muted)'] };
  const [bg, fg] = m[color] || m.muted;
  return <span style={{ background: bg, color: fg, padding: '1px 5px', borderRadius: 3, fontSize: '0.55rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{children}</span>;
}

const TBLST = { width: '100%', borderCollapse: 'collapse' };
const THEAD = { padding: '5px 7px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left', letterSpacing: '0.04em' };
const TD = { padding: '5px 7px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
const TH = { fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '4px 5px', letterSpacing: '0.05em', textAlign: 'center', fontSize: '0.68rem' };
const btnSt = (bg, color) => ({ background: bg, border: `1px solid ${color}55`, color, padding: '5px 11px', borderRadius: 4, cursor: 'pointer', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.05em' });