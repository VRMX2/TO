import { useState, useCallback, useRef, useMemo } from 'react';
import Header from '../components/Header';
import { useI18n } from '../i18n/I18nProvider';
import {
  FileText, Brain, Download, RefreshCw, CheckCircle,
  AlertTriangle, Shield, Target, Activity,
  ChevronRight, Clock, BarChart2, Lock, Cpu
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   GAME-THEORY CONSTANTS (mirrors Simulation.jsx)
══════════════════════════════════════════════════ */
const PAYOFF = [
  [5, 2, -1, 4],
  [4, 6, 8, 3],
  [-3, 1, 7, 2],
  [2, -2, 5, 0],
];
const DEFENSE_STRATEGIES = ['D1', 'D2', 'D3', 'D4'];

function solveMixedNash(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let p = Array(m).fill(1 / m), q = Array(n).fill(1 / n);
  for (let it = 0; it < 4000; it++) {
    const ap = p.map((_, i) => q.reduce((s, qj, j) => s + qj * matrix[i][j], 0));
    const dp = q.map((_, j) => p.reduce((s, pi, i) => s + pi * matrix[i][j], 0));
    const ma = p.reduce((s, pi, i) => s + pi * ap[i], 0);
    const md = q.reduce((s, qj, j) => s + qj * dp[j], 0);
    p = p.map((pi, i) => Math.max(1e-9, pi + 0.04 * (ap[i] - ma)));
    q = q.map((qj, j) => Math.max(1e-9, qj - 0.04 * (dp[j] - md)));
    const sp = p.reduce((a, b) => a + b, 0), sq = q.reduce((a, b) => a + b, 0);
    p = p.map(v => v / sp); q = q.map(v => v / sq);
  }
  const v = p.reduce((s, pi, i) => s + q.reduce((ss, qj, j) => ss + pi * qj * matrix[i][j], 0), 0);
  return { p, q, v };
}

function findPureNash(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const result = [];
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      const colMax = Math.max(...matrix.map(row => row[c]));
      const rowMin = Math.min(...matrix[r]);
      if (matrix[r][c] === colMax && matrix[r][c] === rowMin)
        result.push({ row: r, col: c, value: matrix[r][c] });
    }
  return result;
}

/* ══════════════════════════════════════════════════
   CLAUDE AI REPORT GENERATOR
══════════════════════════════════════════════════ */
/* Single backend call — proxied via Vite/Nginx /api -> backend */
async function generateFullReport(params) {
  const { nash, pureNash, gameValue, scenario, rounds } = params;

  const response = await fetch('/api/ai/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nash_p: nash.p,
      nash_q: nash.q,
      game_value: gameValue,
      pure_nash: pureNash.map(n => ({ row: n.row, col: n.col })),
      scenario,
      rounds,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error ${response.status}`);
  }

  const data = await response.json();
  return { reportText: data.briefing, threatData: data.threat };
}

/* ══════════════════════════════════════════════════
   MAIN REPORT COMPONENT
══════════════════════════════════════════════════ */
export default function Report() {
  const { t } = useI18n();
  const attackNames = t('common.attackStrategies') || [];
  const defenseNames = t('common.defenseStrategies') || [];
  const [scenario, setScenario] = useState('Standard 4×4 Zero-Sum');
  const [rounds, setRounds] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [reportText, setReportText] = useState('');
  const [threatData, setThreatData] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [phase, setPhase] = useState('');
  const [exportFormat, setExportFormat] = useState('txt');
  const reportRef = useRef(null);

  const { p, q, v } = solveMixedNash(PAYOFF);
  const pureNash = findPureNash(PAYOFF);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setReportText('');
    setThreatData(null);
    setGenerated(false);

    try {
      setPhase('Contacting backend AI engine...');
      const { reportText: report, threatData: threat } = await generateFullReport({
        nash: { p, q }, pureNash, gameValue: v, scenario, rounds,
      });

      setPhase('Compiling executive briefing...');
      await new Promise(res => setTimeout(res, 400));

      setReportText(report);
      setThreatData(threat);
      setGenerated(true);
    } catch (err) {
      console.error('Report generation error:', err);
      setReportText('ERROR: ' + (err.message || 'Failed to generate report. Make sure backend is running.'));
    } finally {
      setGenerating(false);
      setPhase('');
    }
  }, [p, q, v, scenario, rounds]);

  const handleExport = useCallback(() => {
    if (!reportText) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `security-briefing-${timestamp}.${exportFormat}`;

    let content = '';
    if (exportFormat === 'txt') {
      content = `EXECUTIVE SECURITY BRIEFING\n${'='.repeat(60)}\nGenerated: ${new Date().toLocaleString()}\nScenario: ${scenario} | Rounds: ${rounds}\nGame Value (v*): ${v.toFixed(4)}\n${'='.repeat(60)}\n\n${reportText}`;
      if (threatData) {
        content += `\n\n${'='.repeat(60)}\nTHREAT METRICS\n${'='.repeat(60)}\nRisk Score: ${threatData.riskScore}/100 (${threatData.riskLabel})\nAttacker Advantage: ${threatData.attackerAdvantage > 0 ? '+' : ''}${threatData.attackerAdvantage}\nPrimary Threat: ${threatData.primaryThreat}\nRecommended Mitigation: ${threatData.primaryMitigation}\nConfidence: ${threatData.confidenceLevel}%\nKey Insight: ${threatData.keyInsight}`;
      }
    } else if (exportFormat === 'json') {
      content = JSON.stringify({
        metadata: { generated: new Date().toISOString(), scenario, rounds, gameValue: v },
        nashEquilibrium: { p, q, pureNash, gameValue: v },
        threatAssessment: threatData,
        executiveBriefing: reportText,
      }, null, 2);
    } else if (exportFormat === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Scenario', scenario],
        ['Rounds', rounds],
        ['Game Value (v*)', v.toFixed(4)],
        ['Risk Score', threatData?.riskScore ?? 'N/A'],
        ['Risk Level', threatData?.riskLabel ?? 'N/A'],
        ['Primary Threat', threatData?.primaryThreat ?? 'N/A'],
        ['Primary Defense', threatData?.primaryMitigation ?? 'N/A'],
        ...attackNames.map((s, i) => [`Attacker σ*: ${s}`, `${(p[i] * 100).toFixed(2)}%`]),
        ...defenseNames.map((s, i) => [`Defender σ*: ${s}`, `${(q[i] * 100).toFixed(2)}%`]),
      ];
      content = rows.map(r => r.join(',')).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, [reportText, threatData, exportFormat, scenario, rounds, p, q, v, attackNames, defenseNames]);

  /* Parse report into named sections */
  const sections = useMemo(() => {
    if (!reportText) return [];
    const SECTION_TITLES = [
      'EXECUTIVE SUMMARY',
      'NASH EQUILIBRIUM INTERPRETATION',
      'CRITICAL THREAT VECTORS',
      'RECOMMENDED DEFENSE POSTURE',
      'STRATEGIC CONCLUSION',
    ];
    const result = [];
    for (let i = 0; i < SECTION_TITLES.length; i++) {
      const title = SECTION_TITLES[i];
      const start = reportText.indexOf(title);
      if (start === -1) continue;
      const nextStart = i + 1 < SECTION_TITLES.length
        ? reportText.indexOf(SECTION_TITLES[i + 1])
        : reportText.length;
      const body = reportText.slice(start + title.length, nextStart === -1 ? undefined : nextStart).trim();
      result.push({ title, body });
    }
    if (result.length === 0) result.push({ title: 'FULL REPORT', body: reportText });
    return result;
  }, [reportText]);

  const sectionColors = ['cyan', 'amber', 'green', 'cyan', 'amber'];
  const sectionIcons = [FileText, Target, AlertTriangle, Shield, CheckCircle];

  return (
    <div className="dashboard-layout page-transition">
      <Header />
      <div className="page-transition delay-1" style={{ gridColumn: '1/-1', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={22} style={{ color: 'var(--accent-green)' }} />
            <div>
              <h2 className="text-primary font-mono" style={{ fontSize: '1rem', margin: 0, letterSpacing: '0.1em' }}>
                {t('report.title')}
              </h2>
              <p className="text-secondary" style={{ fontSize: '0.72rem', margin: 0, marginTop: 2 }}>
                {t('report.subtitle')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={13} style={{ color: 'var(--accent-amber)' }} />
            <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--accent-amber)' }}>
              {t('report.powered')}
            </span>
          </div>
        </div>

        {/* Top Row: Config + Nash Summary */}
        <div className="page-transition delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>

          {/* Config Panel */}
          <Panel color="cyan" title={t('report.config')} icon={<Cpu size={12} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <ConfigRow label={t('report.scenarioLabel')}>
                <select
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  style={selectSt}
                >
                  <option>Standard 4×4 Zero-Sum</option>
                  <option>Advanced APT Scenario</option>
                  <option>Zero-Sum Symmetric</option>
                </select>
              </ConfigRow>
              <ConfigRow label={t('report.roundsLabel')}>
                <select
                  value={rounds}
                  onChange={e => setRounds(Number(e.target.value))}
                  style={selectSt}
                >
                  {[10, 25, 50, 100, 200].map(r => (
                    <option key={r} value={r}>{r} rounds</option>
                  ))}
                </select>
              </ConfigRow>
              <ConfigRow label={t('report.exportAsLabel')}>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  style={selectSt}
                >
                  <option value="txt">{t('report.optionPlainText')}</option>
                  <option value="json">{t('report.optionJson')}</option>
                  <option value="csv">{t('report.optionCsv')}</option>
                </select>
              </ConfigRow>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  ...actionBtn('var(--accent-amber)', 'rgba(255,214,10,0.12)'),
                  marginTop: '0.25rem',
                  opacity: generating ? 0.7 : 1,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                {generating
                  ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> {t('report.generating')}</>
                  : <><Brain size={13} /> {t('report.generate')}</>}
              </button>
              {generating && phase && (
                <p className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--accent-amber)', margin: 0, textAlign: 'center', opacity: 0.8 }}>
                  ⟳ {phase}
                </p>
              )}
            </div>
          </Panel>

          {/* Nash Summary */}
          <Panel color="amber" title={t('report.nashSummary')} icon={<Target size={12} />}>
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>{t('report.gameValueLabel')}</span>
                <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>{v.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>{t('report.pureNeLabel')}</span>
                <span className="font-mono" style={{ fontSize: '0.65rem', color: pureNash.length > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {pureNash.length > 0 ? pureNash.map(n => `(A${n.row + 1},D${n.col + 1})`).join(' ') : t('report.noneMixed')}
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <p className="font-mono text-muted" style={{ fontSize: '0.55rem', margin: '0 0 4px' }}>{t('report.attackerSigma')}</p>
                {p.map((prob, i) => (
                  <MiniBar key={i} label={`A${i + 1}`} value={prob} color="var(--accent-red)" />
                ))}
                <p className="font-mono text-muted" style={{ fontSize: '0.55rem', margin: '6px 0 4px' }}>{t('report.defenderSigma')}</p>
                {q.map((prob, i) => (
                  <MiniBar key={i} label={`D${i + 1}`} value={prob} color="var(--accent-cyan)" />
                ))}
              </div>
            </div>
          </Panel>

          {/* Threat Assessment */}
          <Panel color="green" title={t('report.threat')} icon={<Activity size={12} />}>
            {threatData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Risk badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  <div style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 8,
                    border: `2px solid ${riskColor(threatData.riskLabel)}`,
                    background: `${riskColor(threatData.riskLabel)}12`,
                    textAlign: 'center',
                  }}>
                    <div className="font-mono" style={{ fontSize: '1.6rem', color: riskColor(threatData.riskLabel), lineHeight: 1 }}>
                      {threatData.riskScore}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.6rem', color: riskColor(threatData.riskLabel), letterSpacing: '0.1em', marginTop: 2 }}>
                      {threatData.riskLabel} RISK
                    </div>
                  </div>
                </div>
                <StatRow label={t('report.primaryThreat')} value={threatData.primaryThreat} color="var(--accent-red)" />
                <StatRow label={t('report.topMitigation')} value={threatData.primaryMitigation} color="var(--accent-cyan)" />
                <StatRow label={t('report.attackerAdv')} value={`${threatData.attackerAdvantage > 0 ? '+' : ''}${threatData.attackerAdvantage}`}
                  color={threatData.attackerAdvantage > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
                <StatRow label={t('report.confidence')} value={`${threatData.confidenceLevel}%`} color="var(--accent-amber)" />
                <div style={{ marginTop: '0.25rem', padding: '0.4rem 0.6rem', background: 'rgba(0,255,102,0.05)', border: '1px solid rgba(0,255,102,0.15)', borderRadius: 5 }}>
                  <p className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {threatData.keyInsight}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: '0.5rem', opacity: 0.4 }}>
                <BarChart2 size={28} style={{ color: 'var(--accent-green)' }} />
                <span className="font-mono text-muted" style={{ fontSize: '0.6rem' }}>{t('report.awaitingGeneration')}</span>
              </div>
            )}
          </Panel>
        </div>

        {/* Payoff Matrix Reference */}
        <Panel color="cyan" title={t('report.matrixRef')} icon={<Lock size={12} />}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH('var(--text-muted)')}>u_A(·)</th>
                  {DEFENSE_STRATEGIES.map((d, i) => (
                    <th key={i} style={TH('var(--accent-cyan)')}>D{i + 1}: {defenseNames[i]}</th>
                  ))}
                  <th style={TH('var(--text-muted)')}>σ*_A</th>
                </tr>
              </thead>
              <tbody>
                {PAYOFF.map((row, r) => (
                  <tr key={r} style={{ background: r % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <td style={TD}><span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>A{r + 1}: {attackNames[r]}</span></td>
                    {row.map((val, c) => {
                      const isMax = val === Math.max(...row);
                      const isMin = val === Math.min(...PAYOFF.map(rr => rr[c]));
                      return (
                        <td key={c} style={{ ...TD, textAlign: 'center', background: isMax && isMin ? 'rgba(255,214,10,0.12)' : 'transparent' }}>
                          <span className="font-mono" style={{
                            fontSize: '0.75rem',
                            color: val > 0 ? 'var(--accent-red)' : val < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            fontWeight: isMax && isMin ? 700 : 400,
                          }}>
                            {val > 0 ? `+${val}` : val}
                          </span>
                        </td>
                      );
                    })}
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-amber)' }}>
                        {(p[r] * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={TD}><span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>σ*_D</span></td>
                  {q.map((prob, i) => (
                    <td key={i} style={{ ...TD, textAlign: 'center' }}>
                      <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{(prob * 100).toFixed(1)}%</span>
                    </td>
                  ))}
                  <td style={TD} />
                </tr>
              </tbody>
            </table>
          </div>
          {pureNash.length === 0 && (
            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(255,214,10,0.05)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 5 }}>
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--accent-amber)' }}>
                {t('report.noPureHint')}
              </span>
            </div>
          )}
        </Panel>

        {/* AI Report Sections */}
        {generated && sections.length > 0 && (
          <>
            <div className="page-transition delay-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--accent-green)', letterSpacing: '0.08em' }}>
                  {t('report.generated')} — {sections.length} SECTIONS
                </span>
              </div>
              <button
                onClick={handleExport}
                style={actionBtn('var(--accent-green)', 'rgba(0,255,102,0.1)')}
              >
                <Download size={13} /> {t('report.export')} {exportFormat.toUpperCase()}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} ref={reportRef}>
              {sections.map((sec, i) => {
                const SIcon = sectionIcons[i] || FileText;
                return (
                  <Panel
                    key={i}
                    color={sectionColors[i]}
                    title={`${i + 1}. ${sec.title}`}
                    icon={<SIcon size={12} />}
                    style={i === sections.length - 1 && sections.length % 2 !== 0 ? { gridColumn: '1/-1' } : {}}
                  >
                    <p style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.8,
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {sec.body}
                    </p>
                  </Panel>
                );
              })}
            </div>

            {/* Metadata footer */}
            <div style={{
              padding: '0.6rem 1rem',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>
                  {t('report.generatedAt')}: {new Date().toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Brain size={11} style={{ color: 'var(--accent-amber)' }} />
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>{t('report.modelLabel')}: Claude Sonnet 4</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={11} style={{ color: 'var(--accent-cyan)' }} />
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>
                  {t('report.scenarioMeta')}: {scenario} · {rounds} {t('report.roundsMeta')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={11} style={{ color: 'var(--accent-green)' }} />
                <span className="font-mono text-muted" style={{ fontSize: '0.58rem' }}>
                  v* = {v.toFixed(4)} · {PAYOFF.length}×{PAYOFF[0].length} {t('report.zeroSumMeta')}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!generated && !generating && (
          <div style={{
            border: '1px dashed rgba(0,255,102,0.2)',
            borderRadius: 10,
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <FileText size={42} style={{ color: 'var(--accent-green)', opacity: 0.4 }} />
            <div style={{ textAlign: 'center' }}>
              <h3 className="font-mono text-primary" style={{ fontSize: '0.85rem', margin: 0, letterSpacing: '0.08em' }}>
                {t('report.emptyTitle')}
              </h3>
              <p className="text-secondary" style={{ fontSize: '0.68rem', marginTop: '0.4rem', maxWidth: 400, lineHeight: 1.6 }}>
                {t('report.emptyHelp')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(t('report.emptyTags') || []).map(tag => (
                <span key={tag} style={{
                  padding: '3px 8px',
                  border: '1px solid rgba(0,255,102,0.25)',
                  borderRadius: 4,
                  fontSize: '0.58rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-green)',
                  background: 'rgba(0,255,102,0.05)',
                }}>
                  <ChevronRight size={9} style={{ display: 'inline', marginRight: 2 }} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select { background: var(--bg-panel); border: 1px solid rgba(255,255,255,0.12); color: var(--text-primary); padding: 3px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.62rem; outline: none; cursor: pointer; }
        select:focus { border-color: rgba(0,240,255,0.4); }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HELPER COMPONENTS
══════════════════════════════════════════════════ */
function Panel({ color, title, icon, children, style = {} }) {
  const accent = { cyan: 'var(--accent-cyan)', amber: 'var(--accent-amber)', green: 'var(--accent-green)', red: 'var(--accent-red)' }[color] || 'var(--border-subtle)';
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.9))',
      border: `1px solid ${accent}28`,
      borderTop: `2px solid ${accent}55`,
      borderRadius: 14, padding: '1.1rem',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.04)`,
      position: 'relative', overflow: 'hidden',
      ...style
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        {icon && <span style={{ color: accent }}>{icon}</span>}
        <span className="font-mono" style={{ fontSize: '0.68rem', color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function MiniBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 5 }}>
      <span className="font-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', width: 20, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 4, boxShadow: `0 0 8px ${color}`, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <span className="font-mono" style={{ fontSize: '0.55rem', color, width: 38, textAlign: 'right', flexShrink: 0 }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function ConfigRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
      <span className="font-mono text-muted" style={{ fontSize: '0.58rem', whiteSpace: 'nowrap' }}>{label}</span>
      {children}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.32rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="font-mono text-muted" style={{ fontSize: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
      <span className="font-mono" style={{ fontSize: '0.65rem', color, textShadow: `0 0 8px ${color}` }}>{value}</span>
    </div>
  );
}

function riskColor(label) {
  return { CRITICAL: '#ff3b30', HIGH: '#ff6b35', MEDIUM: '#ffd60a', LOW: '#00ff66' }[label] || '#00f0ff';
}

const selectSt = { width: '100%', minWidth: 0 };

const actionBtn = (color, bg) => ({
  background: bg,
  border: `1px solid ${color}55`,
  color,
  padding: '7px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.63rem',
  fontFamily: 'var(--font-mono)',
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  boxShadow: `0 4px 15px ${color}15`,
});

const TH = (color) => ({
  padding: '5px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.58rem',
  color,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center',
  letterSpacing: '0.03em',
  fontWeight: 500,
});

const TD = {
  padding: '5px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
};