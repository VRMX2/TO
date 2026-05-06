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

const STRATEGIES = {
  att: ['SQL Injection', 'DDoS Flood', 'Zero-Day Exploit', 'Phishing APT'],
  def: ['Firewall', 'Intrusion Det.', 'Patch System', 'Honey Pot'],
};

const DEFAULT_MATRIX = [
  [5, 2, -1, 4],
  [4, 6, 8, 3],
  [-3, 1, 7, 2],
  [2, -2, 5, 0],
];

const fmt = v => v > 0 ? `+${v}` : `${v}`;
const pct = v => (v * 100).toFixed(1) + '%';

export default function Analysis() {
  const { language } = useI18n();
  const i18n = {
    en: {
      title: 'DEEP EQUILIBRIUM ANALYSIS',
      subtitle: 'Zero-sum cyber-security game · Attacker vs Defender · Click matrix cells to edit',
      randomize: 'RANDOMIZE',
      reset: 'RESET',
      payoffMatrix: 'PAYOFF MATRIX',
      payoffSubtitle: 'Click any cell to edit · NE = Nash Eq · PO = Pareto Optimal',
      payoffHelp: 'Row player = Attacker (maximizer) · Column player = Defender (minimizer) · Zero-sum: u_D = −u_A',
      mixedProb: 'MIXED STRATEGY PROBABILITIES',
      attackerSigma: 'ATTACKER σ_A*',
      defenderSigma: 'DEFENDER σ_D*',
      pureTitle: 'PURE NASH EQUILIBRIA',
      noneFound: 'NONE FOUND',
      found: 'FOUND',
      noPure: 'NO PURE NASH EQUILIBRIUM EXISTS',
      noPureHelp: 'No saddle point found in this matrix.\nThe game is solved only in mixed strategies.',
      mixedTitle: 'MIXED NASH EQUILIBRIUM',
      mixedBadge: 'UNIQUE (von Neumann)',
      paretoTitle: 'PARETO OPTIMAL PROFILES',
      support: 'IN SUPPORT',
      excluded: 'EXCLUDED',
      minimax: 'Minimax value:',
      paretoSummary: 'Pareto-optimal profiles found.',
      theory: 'THEORY & DEFINITION',
      pureTheory: '<strong>Definition:</strong> (s*_A, s*_D) is a Pure NE iff:<br />&nbsp;&nbsp;① u_A(s*_A, s*_D) ≥ u_A(s_A, s*_D) for all s_A &nbsp;<em>(attacker best-response)</em><br />&nbsp;&nbsp;② u_D(s*_A, s*_D) ≤ u_D(s*_A, s_D) for all s_D &nbsp;<em>(defender best-response)</em><br />In zero-sum games this equals a <strong>saddle point</strong>: column max AND row min simultaneously.<br /><strong>Minimax theorem:</strong> If a saddle point exists, v* = max_A min_D u = min_D max_A u.',
      mixedTheory: '<strong>Definition:</strong> σ* = (σ*_A, σ*_D) is a Mixed NE iff:<br />&nbsp;&nbsp;E[u_A(σ*_A, σ*_D)] ≥ E[u_A(σ_A, σ*_D)] for all mixed σ_A<br /><strong>Indifference principle:</strong> At equilibrium, every pure strategy in the support yields equal expected payoff.<br /><strong>Minimax theorem (von Neumann 1928):</strong> max_σA min_σD E[u] = min_σD max_σA E[u] = v*<br /><em>Solved via iterative best-response (fictitious play). For exact results use LP.</em>',
      paretoTheory: '<strong>Definition:</strong> (s_A, s_D) is Pareto optimal iff ∄ (s\'_A, s\'_D) such that:<br />&nbsp;&nbsp;u_A(s\') ≥ u_A(s) AND u_D(s\') ≥ u_D(s) with at least one strict inequality.<br />In zero-sum games u_D = −u_A, so profiles maximizing u_A are Pareto optimal.<br /><strong>Note:</strong> Nash equilibria need not be Pareto optimal (Prisoner\'s Dilemma paradox), but in zero-sum games the Nash value is always Pareto efficient on the payoff frontier.',
      minimaxHint: 'Attacker guarantees ≥ v*, Defender guarantees ≤ v*.',
      paretoFooterWithPure: 'Pure NE at {{profiles}} lies on the Pareto frontier.',
      paretoFooterNoPure: 'No pure NE — mixed equilibrium lies in the Pareto interior.',
    },
    fr: {
      title: 'ANALYSE APPROFONDIE D EQUILIBRE',
      subtitle: 'Jeu cyber zero-sum · Attaquant vs Defenseur · Cliquez une cellule pour modifier',
      randomize: 'ALEATOIRE',
      reset: 'REINITIALISER',
      payoffMatrix: 'MATRICE DE GAIN',
      payoffSubtitle: 'Cliquez une cellule · NE = Equilibre de Nash · PO = Pareto Optimal',
      payoffHelp: 'Lignes = Attaquant (maximise) · Colonnes = Defenseur (minimise) · Zero-sum: u_D = −u_A',
      mixedProb: 'PROBABILITES STRATEGIES MIXTES',
      attackerSigma: 'ATTAQUANT σ_A*',
      defenderSigma: 'DEFENSEUR σ_D*',
      pureTitle: 'EQUILIBRES DE NASH PURS',
      noneFound: 'AUCUN',
      found: 'TROUVES',
      noPure: 'AUCUN EQUILIBRE DE NASH PUR',
      noPureHelp: 'Aucun point selle dans cette matrice.\nLe jeu se resout en strategies mixtes.',
      mixedTitle: 'EQUILIBRE DE NASH MIXTE',
      mixedBadge: 'UNIQUE (von Neumann)',
      paretoTitle: 'PROFILS PARETO OPTIMAUX',
      support: 'DANS LE SUPPORT',
      excluded: 'EXCLU',
      minimax: 'Valeur minimax:',
      paretoSummary: 'Profils Pareto optimaux trouves.',
      theory: 'THEORIE & DEFINITION',
      pureTheory: '<strong>Definition:</strong> (s*_A, s*_D) est un Nash pur si:<br />&nbsp;&nbsp;① u_A(s*_A, s*_D) ≥ u_A(s_A, s*_D) pour tout s_A<br />&nbsp;&nbsp;② u_D(s*_A, s*_D) ≤ u_D(s*_A, s_D) pour tout s_D<br />Dans un jeu zero-sum, cela correspond a un <strong>point selle</strong>.<br /><strong>Theoreme minimax:</strong> si un point selle existe, v* = max_A min_D u = min_D max_A u.',
      mixedTheory: '<strong>Definition:</strong> σ* = (σ*_A, σ*_D) est un Nash mixte si:<br />&nbsp;&nbsp;E[u_A(σ*_A, σ*_D)] ≥ E[u_A(σ_A, σ*_D)] pour toute strategie mixte σ_A<br /><strong>Principe d indifference:</strong> les strategies du support donnent le meme gain espere.<br /><strong>Theoreme minimax:</strong> max_σA min_σD E[u] = min_σD max_σA E[u] = v*<br /><em>Resolution approximative par fictitious play.</em>',
      paretoTheory: '<strong>Definition:</strong> (s_A, s_D) est Pareto optimal s il n existe pas (s\'_A, s\'_D) tel que:<br />&nbsp;&nbsp;u_A(s\') ≥ u_A(s) ET u_D(s\') ≥ u_D(s), avec au moins une inegalite stricte.<br />En zero-sum, u_D = −u_A.<br /><strong>Note:</strong> un Nash n est pas toujours Pareto optimal.',
      minimaxHint: 'L attaquant garantit ≥ v*, le defenseur garantit ≤ v*.',
      paretoFooterWithPure: 'Le Nash pur {{profiles}} est sur la frontiere de Pareto.',
      paretoFooterNoPure: 'Pas de Nash pur — l equilibre mixte est a l interieur de Pareto.',
    },
    ar: {
      title: 'تحليل التوازن المتقدم',
      subtitle: 'لعبة امن سيبراني صفرية المجموع · مهاجم ضد مدافع · انقر لتعديل الخلايا',
      randomize: 'توليد عشوائي',
      reset: 'اعادة تعيين',
      payoffMatrix: 'مصفوفة العوائد',
      payoffSubtitle: 'انقر على اي خلية للتعديل · NE = توازن ناش · PO = باريتو',
      payoffHelp: 'الصفوف = المهاجم (تعظيم) · الاعمدة = المدافع (تقليل) · لعبة صفرية: u_D = −u_A',
      mixedProb: 'احتمالات الاستراتيجيات المختلطة',
      attackerSigma: 'المهاجم σ_A*',
      defenderSigma: 'المدافع σ_D*',
      pureTitle: 'توازنات ناش النقية',
      noneFound: 'لا يوجد',
      found: 'تم العثور',
      noPure: 'لا يوجد توازن ناش نقي',
      noPureHelp: 'لا توجد نقطة سرج في هذه المصفوفة.\nيحل اللعب باستراتيجيات مختلطة.',
      mixedTitle: 'توازن ناش المختلط',
      mixedBadge: 'فريد (فون نيومان)',
      paretoTitle: 'حلول باريتو المثلى',
      support: 'ضمن الدعم',
      excluded: 'مستبعد',
      minimax: 'قيمة المينيماكس:',
      paretoSummary: 'تم العثور على حلول باريتو المثلى.',
      theory: 'النظرية والتعريف',
      pureTheory: '<strong>التعريف:</strong> يكون (s*_A, s*_D) توازنا نقيا اذا:<br />&nbsp;&nbsp;① u_A(s*_A, s*_D) ≥ u_A(s_A, s*_D) لكل s_A<br />&nbsp;&nbsp;② u_D(s*_A, s*_D) ≤ u_D(s*_A, s_D) لكل s_D<br />في اللعبة صفرية المجموع يطابق ذلك <strong>نقطة السرج</strong>.<br /><strong>مبرهنة المينيماكس:</strong> اذا وجدت نقطة سرج فان v* = max_A min_D u = min_D max_A u.',
      mixedTheory: '<strong>التعريف:</strong> σ* = (σ*_A, σ*_D) توازن مختلط اذا:<br />&nbsp;&nbsp;E[u_A(σ*_A, σ*_D)] ≥ E[u_A(σ_A, σ*_D)] لكل σ_A مختلط<br /><strong>مبدأ اللامبالاة:</strong> كل استراتيجية داخل الدعم تعطي نفس العائد المتوقع.<br /><strong>مبرهنة المينيماكس:</strong> max_σA min_σD E[u] = min_σD max_σA E[u] = v*<br /><em>تم الحل بطريقة استجابة متكررة تقريبية.</em>',
      paretoTheory: '<strong>التعريف:</strong> (s_A, s_D) امثل باريتو اذا لا يوجد (s\'_A, s\'_D) بحيث:<br />&nbsp;&nbsp;u_A(s\') ≥ u_A(s) و u_D(s\') ≥ u_D(s) مع تفوق صارم في احدهما.<br />في اللعبة الصفرية: u_D = −u_A.<br /><strong>ملاحظة:</strong> ليس كل توازن ناش امثل باريتو.',
      minimaxHint: 'المهاجم يضمن ≥ v* والمدافع يضمن ≤ v*.',
      paretoFooterWithPure: 'توازن ناش النقي {{profiles}} يقع على حد باريتو.',
      paretoFooterNoPure: 'لا يوجد توازن ناش نقي — التوازن المختلط داخل باريتو.',
    },
  }[language] || {
    title: 'DEEP EQUILIBRIUM ANALYSIS',
  };
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
              <h2 className="text-primary font-mono" style={{ fontSize: '1rem', margin: 0, letterSpacing: '0.1em' }}>{i18n.title}</h2>
              <p className="text-secondary" style={{ fontSize: '0.72rem', margin: 0, marginTop: 2 }}>{i18n.subtitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={randomize} style={btnSt('rgba(0,240,255,0.1)', 'var(--accent-cyan)')}>
              <RefreshCw size={11} /> {i18n.randomize}
            </button>
            <button onClick={reset} style={btnSt('rgba(255,255,255,0.05)', 'var(--text-muted)')}>{i18n.reset}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Payoff Matrix */}
            <Panel color="cyan" title={i18n.payoffMatrix} subtitle={i18n.payoffSubtitle}>
              <p className="text-muted font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.75rem' }}>
                {i18n.payoffHelp}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, textAlign: 'left', color: 'var(--text-muted)', width: 110, fontSize: '0.58rem' }}>ATT \ DEF →</th>
                      {STRATEGIES.def.map((d, j) => (
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
                          A{r + 1} <span style={{ fontSize: '0.52rem', fontWeight: 400, color: 'var(--text-muted)' }}>{STRATEGIES.att[r]}</span>
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
                {[['var(--accent-amber)', 'NE  Nash Equilibrium (saddle)'], ['var(--accent-green)', 'PO  Pareto Optimal profile'], ['var(--accent-cyan)', '+  Attacker gain'], ['var(--accent-red)', '−  Attacker loss']].map(([clr, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, background: clr, borderRadius: 1 }} />{lbl}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Mixed Strategy Probabilities */}
            <Panel color="amber" title={i18n.mixedProb}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-red font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{i18n.attackerSigma}</div>
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
                  <div className="text-cyan font-mono" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>{i18n.defenderSigma}</div>
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
                {[['GAME VALUE v*', gameValue.toFixed(4), 'var(--accent-amber)'], ['ATT. UTIL. E[u_A]', gameValue.toFixed(4), 'var(--accent-red)'], ['DEF. UTIL. E[u_D]', (-gameValue).toFixed(4), 'var(--accent-cyan)']].map(([lbl, val, clr]) => (
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
            <Panel color="amber" title={i18n.pureTitle} badge={pureNash.length === 0 ? i18n.noneFound : `${pureNash.length} ${i18n.found}`}>
              <Collapse open={showInfo.pure} onToggle={() => toggle('pure')}>
                <span dangerouslySetInnerHTML={{ __html: i18n.pureTheory }} />
              </Collapse>
              {pureNash.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,214,10,0.25)', borderRadius: 6 }}>
                  <p className="text-amber font-mono" style={{ fontSize: '0.72rem', margin: 0 }}>{i18n.noPure}</p>
                  <p className="text-muted" style={{ fontSize: '0.62rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                    {i18n.noPureHelp.split('\n')[0]}<br />{i18n.noPureHelp.split('\n')[1]}
                  </p>
                </div>
              ) : (
                <table style={{ ...TBLST, marginTop: 0 }}>
                  <thead>
                    <tr>{['Profile', 'Att. Strategy', 'Def. Strategy', 'Value', 'Col. Max?', 'Row Min?'].map(h => <th key={h} style={THEAD}>{h}</th>)}</tr>
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
                          <td style={TD}><span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>{STRATEGIES.att[ne.row]}</span></td>
                          <td style={TD}><span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{STRATEGIES.def[ne.col]}</span></td>
                          <td style={TD}><span className="font-mono" style={{ color: 'var(--accent-amber)' }}>{fmt(ne.value)}</span></td>
                          <td style={TD}><Pill color={isColMax ? 'green' : 'red'}>{isColMax ? '✓ YES' : '✗ NO'}</Pill></td>
                          <td style={TD}><Pill color={isRowMin ? 'green' : 'red'}>{isRowMin ? '✓ YES' : '✗ NO'}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>

            {/* Mixed Nash Table */}
            <Panel color="cyan" title={i18n.mixedTitle} badge={i18n.mixedBadge}>
              <Collapse open={showInfo.mixed} onToggle={() => toggle('mixed')}>
                <span dangerouslySetInnerHTML={{ __html: i18n.mixedTheory }} />
              </Collapse>
              <table style={TBLST}>
                <thead>
                  <tr>{['Strategy', 'Name', 'Prob. p_i / q_j', 'In Support?', 'Expected Payoff'].map(h => <th key={h} style={THEAD}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr><td colSpan={5} style={{ ...TD, color: 'var(--accent-red)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', paddingTop: '0.6rem', paddingBottom: 2 }}>── ATTACKER MIXED STRATEGY σ*_A ──</td></tr>
                  {p.map((prob, i) => {
                    const expPay = q.reduce((s, qj, j) => s + qj * matrix[i][j], 0);
                    const inSupport = prob > 0.01;
                    return (
                      <tr key={`a${i}`} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono text-red" style={{ fontSize: '0.72rem' }}>A{i + 1}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{STRATEGIES.att[i]}</span></td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-red)', borderRadius: 2, transition: 'width 0.5s' }} />
                            </div>
                            <span className="font-mono" style={{ fontSize: '0.68rem' }}>{pct(prob)}</span>
                          </div>
                        </td>
                        <td style={TD}><Pill color={inSupport ? 'red' : 'muted'}>{inSupport ? i18n.support : i18n.excluded}</Pill></td>
                        <td style={TD}><span className="font-mono" style={{ fontSize: '0.68rem', color: expPay > gameValue ? 'var(--accent-green)' : 'var(--text-muted)' }}>{expPay.toFixed(3)}</span></td>
                      </tr>
                    );
                  })}
                  <tr><td colSpan={5} style={{ ...TD, color: 'var(--accent-cyan)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', paddingTop: '0.6rem', paddingBottom: 2 }}>── DEFENDER MIXED STRATEGY σ*_D ──</td></tr>
                  {q.map((prob, i) => {
                    const expPay = p.reduce((s, pi, r) => s + pi * matrix[r][i], 0);
                    const inSupport = prob > 0.01;
                    return (
                      <tr key={`d${i}`} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono text-cyan" style={{ fontSize: '0.72rem' }}>D{i + 1}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{STRATEGIES.def[i]}</span></td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2, transition: 'width 0.5s' }} />
                            </div>
                            <span className="font-mono" style={{ fontSize: '0.68rem' }}>{pct(prob)}</span>
                          </div>
                        </td>
                        <td style={TD}><Pill color={inSupport ? 'cyan' : 'muted'}>{inSupport ? i18n.support : i18n.excluded}</Pill></td>
                        <td style={TD}><span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{expPay.toFixed(3)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 6 }}>
                <span className="font-mono text-secondary" style={{ fontSize: '0.62rem' }}>
                  {i18n.minimax}&nbsp;
                  <span className="text-amber" style={{ fontSize: '0.8rem' }}>v* = {gameValue.toFixed(4)}</span>
                  &nbsp;— {i18n.minimaxHint}
                </span>
              </div>
            </Panel>

            {/* Pareto Table */}
            <Panel color="green" title={i18n.paretoTitle} badge={`${pareto.length} PROFILES`}>
              <Collapse open={showInfo.pareto} onToggle={() => toggle('pareto')}>
                <span dangerouslySetInnerHTML={{ __html: i18n.paretoTheory }} />
              </Collapse>
              <table style={TBLST}>
                <thead>
                  <tr>{['Profile', 'Att. Strategy', 'Def. Strategy', 'u_A', 'u_D', 'Is Nash?', 'Dominates?'].map(h => <th key={h} style={THEAD}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {pareto.map((pp, i) => {
                    const isNash = isPure(pp.row, pp.col);
                    const dominated = matrix.flat().some(v => v > pp.att) ? 'Check LP' : 'Frontier';
                    return (
                      <tr key={i} style={i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                        <td style={TD}><span className="font-mono" style={{ color: 'var(--accent-green)', fontSize: '0.72rem' }}>(A{pp.row + 1},D{pp.col + 1})</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{STRATEGIES.att[pp.row]}</span></td>
                        <td style={TD}><span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{STRATEGIES.def[pp.col]}</span></td>
                        <td style={TD}><span className="font-mono" style={{ color: pp.att >= 0 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontSize: '0.72rem' }}>{fmt(pp.att)}</span></td>
                        <td style={TD}><span className="font-mono" style={{ color: pp.def >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)', fontSize: '0.72rem' }}>{fmt(pp.def)}</span></td>
                        <td style={TD}><Pill color={isNash ? 'amber' : 'muted'}>{isNash ? '★ YES' : 'NO'}</Pill></td>
                        <td style={TD}><Pill color="green">NON-DOM</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(0,255,102,0.04)', border: '1px solid rgba(0,255,102,0.15)', borderRadius: 6 }}>
                <span className="font-mono text-secondary" style={{ fontSize: '0.62rem' }}>
                  {pareto.length} {i18n.paretoSummary} {pureNash.length > 0
                    ? i18n.paretoFooterWithPure.replace('{{profiles}}', pureNash.map(n => `(A${n.row + 1},D${n.col + 1})`).join(', '))
                    : i18n.paretoFooterNoPure}
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