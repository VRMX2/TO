import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import MatrixEditor from '../components/dashboard/MatrixEditor';
import PresetManager from '../components/dashboard/PresetManager';
import ExportPanel from '../components/dashboard/ExportPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { useI18n } from '../i18n/I18nProvider';
import { useGameStore } from '../store/gameStore';
import { useGameAPI } from '../hooks/useGameAPI';
import { jsPDF } from 'jspdf';
import { Target, Shield, Zap, Activity, RefreshCw, Cpu, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function Dashboard() {
  const { t } = useI18n();
  const attackNames = t('common.attackStrategies') || [];
  const defenseNames = t('common.defenseStrategies') || [];
  const resolveAttackName = (id, fallback) => attackNames[Number(String(id).replace('A', '')) - 1] || fallback;
  const resolveDefenseName = (id, fallback) => defenseNames[Number(String(id).replace('D', '')) - 1] || fallback;
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

  const {
    computeNash,
    getPareto,
    listPresets,
    savePreset: savePresetApi,
    renamePreset,
    deletePreset,
    simulateAttack: simulateAttackAPI,
    deployDefense: deployDefenseAPI,
  } = useGameAPI();
  const { connected: wsConnected, reconnectInSec } = useWebSocket();

  const [scenario, setScenario] = useState('standard');
  const [topology, setTopology] = useState('star');
  const [aiMode, setAiMode] = useState('rl');
  const [nashData, setNashData] = useState(null);
  const [loading, setLoading] = useState({ nash: false, attack: false, defense: false });
  const [convergenceData, setConvergenceData] = useState([]);
  const [attackResult, setAttackResult] = useState(null);
  const [defenseResult, setDefenseResult] = useState(null);
  const [paretoData, setParetoData] = useState([]);
  const [matrixSize, setMatrixSize] = useState(payoffMatrix.length || 4);
  const [attackerMatrix, setAttackerMatrix] = useState(payoffMatrix);
  const [defenderMatrix, setDefenderMatrix] = useState(payoffMatrix.map((row) => row.map((v) => -v)));
  const [syncZeroSum, setSyncZeroSum] = useState(true);
  const [presetName, setPresetName] = useState('scenario-1');
  const [savedPresets, setSavedPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const importInputRef = useRef(null);

  const resizeMatrix = useCallback((matrix, size) => (
    Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => ((i < matrix.length && j < (matrix[i] || []).length) ? matrix[i][j] : 0))
    )
  ), []);

  const updateCell = useCallback((setter, matrix, r, c, value) => {
    const numeric = Number(value);
    setter(
      matrix.map((row, i) =>
        row.map((cell, j) => (i === r && j === c ? (Number.isFinite(numeric) ? numeric : 0) : cell))
      )
    );
  }, []);

  useEffect(() => {
    if (!syncZeroSum) return;
    setDefenderMatrix(attackerMatrix.map((row) => row.map((v) => -v)));
  }, [attackerMatrix, syncZeroSum]);

  useEffect(() => {
    listPresets()
      .then((rows) => {
        const presets = rows || [];
        setSavedPresets(presets);
        const lastSelected = localStorage.getItem('gt_last_selected_preset');
        if (lastSelected && presets.some((p) => p.name === lastSelected)) {
          const preset = presets.find((p) => p.name === lastSelected);
          setSelectedPreset(lastSelected);
          setPresetName(preset.name);
          setMatrixSize(preset.matrix_size);
          setSyncZeroSum(Boolean(preset.sync_zero_sum));
          setAttackerMatrix(resizeMatrix(preset.attacker_matrix || [], preset.matrix_size));
          setDefenderMatrix(resizeMatrix(preset.defender_matrix || [], preset.matrix_size));
        }
      })
      .catch(() => setSavedPresets([]));
  }, [listPresets, resizeMatrix]);

  useEffect(() => {
    if (!selectedPreset) return;
    localStorage.setItem('gt_last_selected_preset', selectedPreset);
  }, [selectedPreset]);

  const currentScenarioPayload = useCallback(() => ({
    name: presetName || `scenario-${Date.now()}`,
    matrix_size: matrixSize,
    sync_zero_sum: syncZeroSum,
    attacker_matrix: attackerMatrix,
    defender_matrix: defenderMatrix,
  }), [presetName, matrixSize, syncZeroSum, attackerMatrix, defenderMatrix]);

  const savePreset = useCallback(async () => {
    try {
      const payload = currentScenarioPayload();
      await savePresetApi(payload);
      const rows = await listPresets();
      setSavedPresets(rows || []);
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Saved preset: ${payload.name}`, color: 'green' });
    } catch (error) {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: error.message || 'Unable to save preset', color: 'red' });
    }
  }, [currentScenarioPayload, savePresetApi, listPresets, addAILog]);

  const loadPreset = useCallback((name) => {
    const preset = savedPresets.find((p) => p.name === name);
    if (!preset) return;
    setSelectedPreset(name);
    setPresetName(preset.name);
    setMatrixSize(preset.matrix_size);
    setSyncZeroSum(Boolean(preset.sync_zero_sum));
    setAttackerMatrix(resizeMatrix(preset.attacker_matrix || [], preset.matrix_size));
    setDefenderMatrix(resizeMatrix(preset.defender_matrix || [], preset.matrix_size));
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Loaded preset: ${preset.name}`, color: 'cyan' });
  }, [savedPresets, resizeMatrix, addAILog]);

  const renameCurrentPreset = useCallback(async () => {
    const selected = selectedPreset;
    if (!selected || !presetName) return;
    try {
      const payload = currentScenarioPayload();
      await renamePreset(selected, payload);
      const rows = await listPresets();
      setSavedPresets(rows || []);
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Renamed preset to: ${presetName}`, color: 'green' });
    } catch (error) {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: error.message || 'Unable to rename preset', color: 'red' });
    }
  }, [selectedPreset, presetName, currentScenarioPayload, renamePreset, listPresets, addAILog]);

  const removePreset = useCallback(async (name) => {
    if (!name) return;
    try {
      await deletePreset(name);
      const rows = await listPresets();
      setSavedPresets(rows || []);
      if (selectedPreset === name) {
        setSelectedPreset('');
        localStorage.removeItem('gt_last_selected_preset');
      }
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Deleted preset: ${name}`, color: 'amber' });
    } catch (error) {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: error.message || 'Unable to delete preset', color: 'red' });
    }
  }, [deletePreset, listPresets, addAILog, selectedPreset]);

  const exportScenarioJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(currentScenarioPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presetName || 'scenario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentScenarioPayload, presetName]);

  const onImportScenario = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importedA = data.attacker_matrix || data.attackerMatrix || [];
      const importedB = data.defender_matrix || data.defenderMatrix || [];
      const importedSync = data.sync_zero_sum ?? data.syncZeroSum ?? true;
      const size = Number(data.matrix_size || data.matrixSize || (importedA.length ?? 4));
      setPresetName(data.name || 'imported-scenario');
      setMatrixSize(size);
      setSyncZeroSum(Boolean(importedSync));
      setAttackerMatrix(resizeMatrix(importedA, size));
      setDefenderMatrix(resizeMatrix(importedB, size));
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Imported scenario: ${data.name || 'unnamed'}`, color: 'green' });
    } catch {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Invalid scenario JSON file', color: 'red' });
    } finally {
      event.target.value = '';
    }
  }, [resizeMatrix, addAILog]);

  const exportResultsCsv = useCallback(() => {
    const rows = [];
    rows.push('Section,Field,Value');
    rows.push(`Summary,GameValue,${nashData?.attacker_utility ?? ''}`);
    rows.push(`Summary,AttackerUtility,${nashData?.attacker_utility ?? ''}`);
    rows.push(`Summary,DefenderUtility,${nashData?.defender_utility ?? ''}`);
    (nashData?.equilibria || []).forEach((eq) => {
      rows.push(`NashEq#${eq.id},Type,${eq.type}`);
      rows.push(`NashEq#${eq.id},AttackerStrategy,"${(eq.attacker_strategy || []).join(' ')}"`);
      rows.push(`NashEq#${eq.id},DefenderStrategy,"${(eq.defender_strategy || []).join(' ')}"`);
      rows.push(`NashEq#${eq.id},AttackerUtility,${eq.attacker_utility}`);
      rows.push(`NashEq#${eq.id},DefenderUtility,${eq.defender_utility}`);
    });
    (paretoData || []).forEach((p, idx) => {
      rows.push(`Pareto#${idx + 1},Profile,(A${p.attacker_idx + 1},D${p.defender_idx + 1})`);
      rows.push(`Pareto#${idx + 1},AttackerPayoff,${p.attacker_payoff}`);
      rows.push(`Pareto#${idx + 1},DefenderPayoff,${p.defender_payoff}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presetName || 'game-results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nashData, paretoData, presetName]);

  const exportResultsPdf = useCallback(() => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 40;
    doc.setFontSize(16);
    doc.text('Game Theory Report', 40, y);
    y += 24;
    doc.setFontSize(10);
    doc.text(`Scenario: ${presetName || 'default'}`, 40, y); y += 16;
    doc.text(`Matrix Size: ${matrixSize}x${matrixSize}`, 40, y); y += 16;
    doc.text(`Game Value: ${nashData?.attacker_utility ?? 'n/a'}`, 40, y); y += 22;
    doc.setFontSize(12);
    doc.text('Nash Equilibria', 40, y); y += 16;
    doc.setFontSize(9);
    (nashData?.equilibria || []).forEach((eq) => {
      const line = `EQ #${eq.id} (${eq.type}) A:[${(eq.attacker_strategy || []).map((x) => Number(x).toFixed(3)).join(', ')}] D:[${(eq.defender_strategy || []).map((x) => Number(x).toFixed(3)).join(', ')}] U=(${eq.attacker_utility}, ${eq.defender_utility})`;
      const parts = doc.splitTextToSize(line, 520);
      doc.text(parts, 50, y);
      y += (parts.length * 11) + 3;
      if (y > 760) { doc.addPage(); y = 40; }
    });
    y += 8;
    doc.setFontSize(12);
    doc.text('Pareto Profiles', 40, y); y += 16;
    doc.setFontSize(9);
    (paretoData || []).forEach((p) => {
      const line = `(A${p.attacker_idx + 1}, D${p.defender_idx + 1}) => (${Number(p.attacker_payoff).toFixed(2)}, ${Number(p.defender_payoff).toFixed(2)})`;
      doc.text(line, 50, y);
      y += 12;
      if (y > 760) { doc.addPage(); y = 40; }
    });
    doc.save(`${presetName || 'game-results'}.pdf`);
  }, [nashData, paretoData, presetName, matrixSize]);

  // Load Nash on mount / scenario change
  const fetchNash = useCallback(async (attackerOverride = null, defenderOverride = null) => {
    const currentA = attackerOverride || attackerMatrix;
    const currentD = defenderOverride || defenderMatrix;
    setLoading(l => ({ ...l, nash: true }));
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Computing Nash Equilibrium via Python engine...', color: 'secondary' });
    try {
      const [data, pareto] = await Promise.all([
        computeNash(currentA, currentD),
        getPareto(currentA, currentD),
      ]);
      setNashData(data);
      setParetoData(pareto?.pareto_profiles || []);
      setConvergenceData(data.convergence_data || []);
      // Update strategy probabilities in store
      const attStrategies = attackNames;
      const defStrategies = defenseNames;
      updateNashResults({
        nashData: {
          attackerStrategies: data.attacker_strategy.map((p, i) => ({ id: `A${i+1}`, name: attStrategies[i] || `Attack ${i+1}`, prob: Math.round(p * 100) })),
          defenderStrategies: data.defender_strategy.map((p, i) => ({ id: `D${i+1}`, name: defStrategies[i] || `Defense ${i+1}`, prob: Math.round(p * 100) })),
          attValue: data.attacker_utility,
          defValue: data.defender_utility,
        },
        paretoData: { optima: (pareto?.pareto_profiles || []).map((p, idx) => ({ id: idx + 1, strat: `(A${p.attacker_idx + 1},D${p.defender_idx + 1})`, att: `${p.attacker_payoff}`, def_: `${p.defender_payoff}` })) }
      });
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Nash computed — v* = ${data.attacker_utility.toFixed(3)} | ${data.attacker_strategy.map((p,i)=>`A${i+1}:${(p*100).toFixed(0)}%`).join(' ')}`, color: 'cyan' });
    } catch {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Backend offline — check that uvicorn is running on port 8000', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, nash: false }));
    }
  }, [attackerMatrix, defenderMatrix, scenario, attackNames, defenseNames]);

  useEffect(() => { fetchNash(); }, []);

  const handleAttack = useCallback(async () => {
    setLoading(l => ({ ...l, attack: true }));
    setAttackResult(null);
    simulateAttack(); // optimistic update
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Simulating ${scenario} attack on ${topology} topology...`, color: 'red' });
    try {
      const data = await simulateAttackAPI({ topology_type: topology, attack_type: 'DDoS' });
      setAttackResult(data);
      setThreatLevel(Math.min(100, threatLevel + data.severity));
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Attack: ${data.attack_type} → node ${data.attacked_node} | severity ${data.severity} | ${data.status}`, color: 'red' });
    } catch (error) {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: error.message || 'Attack simulation failed', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, attack: false }));
    }
  }, [scenario, topology, threatLevel, simulateAttackAPI, simulateAttack]);

  const handleDefense = useCallback(async () => {
    setLoading(l => ({ ...l, defense: true }));
    setDefenseResult(null);
    deployDefense(); // optimistic update
    addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Deploying ${aiMode === 'rl' ? 'RL-adaptive' : 'static'} defense on ${topology} topology...`, color: 'green' });
    try {
      const data = await deployDefenseAPI({ topology_type: topology });
      setDefenseResult(data);
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: `Defense deployed → ${data.defended_node} | coverage ${(data.coverage * 100).toFixed(0)}% | ${data.action}`, color: 'green' });
    } catch (error) {
      addAILog({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: error.message || 'Defense deployment failed', color: 'amber' });
    } finally {
      setLoading(l => ({ ...l, defense: false }));
    }
  }, [aiMode, topology, deployDefenseAPI, deployDefense]);

  const gameValue = nashData?.attacker_utility ?? 0;

  return (
    <div className="dashboard-layout">
      <Header />

      {/* Controls Bar */}
      <div className="controls-row">
        <div className="controls-left">
          <ConfigSelect label={t('dashboard.scenario')} value={scenario} onChange={setScenario}
            options={[['standard','Standard 4×4'],['zero-sum','Zero-Sum'],['advanced','Advanced APT']]} />
          <ConfigSelect label={t('dashboard.topology')} value={topology} onChange={setTopology}
            options={[['star','Star Network'],['mesh','Mesh Network'],['ring','Ring Network']]} />
          <ConfigSelect label={t('dashboard.aiMode')} value={aiMode} onChange={setAiMode}
            options={[['rl','Reinforcement Learning'],['static','Static Optimal'],['none','Disabled']]} />
        </div>
        <div className="controls-center">
          <button className="btn btn-cyan" onClick={fetchNash} disabled={loading.nash} id="btn-compute-nash">
            {loading.nash ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Target size={14} />}
            {loading.nash ? t('dashboard.computing') : t('dashboard.computeNash')}
          </button>
          <button className="btn btn-red" onClick={handleAttack} disabled={loading.attack} id="btn-simulate-attack">
            {loading.attack ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Zap size={14} />}
            {loading.attack ? t('dashboard.simulating') : t('dashboard.simulateAttack')}
          </button>
          <button className="btn btn-green" onClick={handleDefense} disabled={loading.defense} id="btn-deploy-defense">
            {loading.defense ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> : <Shield size={14} />}
            {loading.defense ? t('dashboard.deploying') : t('dashboard.deployDefense')}
          </button>
        </div>
        <div className="controls-right">
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>
              <div style={{
                width:8,
                height:8,
                borderRadius:'50%',
                background: wsConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                boxShadow: `0 0 6px ${wsConnected ? 'var(--accent-green)' : 'var(--accent-red)'}`,
              }} />
              <span className="font-mono" style={{ fontSize:'0.60rem', color: wsConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {wsConnected ? t('dashboard.wsLive') : t('dashboard.wsOffline')}
              </span>
              {!wsConnected && reconnectInSec > 0 && (
                <span className="font-mono" style={{ fontSize:'0.56rem', color:'var(--text-muted)' }}>
                  {t('dashboard.reconnectIn', { sec: reconnectInSec })}
                </span>
              )}
            </div>
            <div style={{ width:8, height:8, borderRadius:'50%', background: nashData ? 'var(--accent-green)' : 'var(--accent-amber)', boxShadow: `0 0 6px ${nashData ? 'var(--accent-green)' : 'var(--accent-amber)'}` }} />
            <span className="font-mono" style={{ fontSize:'0.62rem', color: nashData ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
              {nashData ? `v* = ${gameValue.toFixed(3)}` : t('dashboard.connecting')}
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
              <StratBar key={s.id} label={s.id} name={resolveAttackName(s.id, s.name)} prob={s.prob} color="var(--accent-red)" />
            ))}
          </div>
          <div>
            <div className="font-mono" style={{ fontSize:'0.6rem', color:'var(--accent-cyan)', marginBottom:'0.4rem', letterSpacing:'0.08em' }}>DEFENDER σ*_D</div>
            {defenderStrategies.map((s, i) => (
              <StratBar key={s.id} label={s.id} name={resolveDefenseName(s.id, s.name)} prob={s.prob} color="var(--accent-cyan)" />
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
                  {(attackerMatrix[0] || []).map((_, i) => <th key={`D${i+1}`} style={mth('var(--accent-cyan)')}>{`D${i+1}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {attackerMatrix.map((row, r) => (
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
            <StatRow label="GAME TYPE" value={`General-Sum ${attackerMatrix.length}×${(attackerMatrix[0] || []).length}`} color="var(--text-secondary)" />
            <StatRow label="ALGORITHM" value="Support Enum." color="var(--accent-cyan)" />
            <StatRow label="GAME VALUE v*" value={nashData ? gameValue.toFixed(4) : '—'} color="var(--accent-amber)" />
            <StatRow label="ATT UTILITY" value={nashData ? nashData.attacker_utility.toFixed(3) : '—'} color="var(--accent-red)" />
            <StatRow label="DEF UTILITY" value={nashData ? nashData.defender_utility.toFixed(3) : '—'} color="var(--accent-cyan)" />
            <StatRow label="BACKEND" value={nashData ? '● ONLINE' : '○ OFFLINE'} color={nashData ? 'var(--accent-green)' : 'var(--accent-amber)'} />
          </div>
        </div>

        <div className="panel" style={{ flexShrink:0 }}>
          <div className="panel-header">
            <div className="panel-title"><Cpu size={14} />MATRIX EDITOR</div>
            <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{t('dashboard.twoPlayers')}</span>
          </div>
          <PresetManager
            presetName={presetName}
            setPresetName={setPresetName}
            savePreset={savePreset}
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            loadPreset={loadPreset}
            savedPresets={savedPresets}
            renameCurrentPreset={renameCurrentPreset}
            openDeleteConfirm={() => setConfirmDeleteOpen(true)}
            exportScenarioJson={exportScenarioJson}
            openImportDialog={() => importInputRef.current?.click()}
            importInputRef={importInputRef}
            onImportScenario={onImportScenario}
          />
          <ExportPanel
            syncZeroSum={syncZeroSum}
            setSyncZeroSum={setSyncZeroSum}
            exportResultsCsv={exportResultsCsv}
            exportResultsPdf={exportResultsPdf}
          />
          <MatrixEditor
            matrixSize={matrixSize}
            setMatrixSize={setMatrixSize}
            resizeMatrix={resizeMatrix}
            setAttackerMatrix={setAttackerMatrix}
            setDefenderMatrix={setDefenderMatrix}
            fetchNash={fetchNash}
            loading={loading}
            attackerMatrix={attackerMatrix}
            defenderMatrix={defenderMatrix}
            updateCell={updateCell}
            syncZeroSum={syncZeroSum}
          />
        </div>

        <div className="panel" style={{ flexShrink:0 }}>
          <div className="panel-header">
            <div className="panel-title"><TrendingUp size={14} />PARETO FRONT</div>
            <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
              {paretoData.length} PROFILES
            </span>
          </div>
          {paretoData.length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.62rem', textAlign:'center', padding:'0.6rem 0.2rem' }}>
              No Pareto profile loaded.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              {paretoData.slice(0, 6).map((p, idx) => (
                <div key={`${p.attacker_idx}-${p.defender_idx}-${idx}`} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'0.2rem' }}>
                  <span className="font-mono" style={{ fontSize:'0.56rem', color:'var(--accent-amber)' }}>{`(A${p.attacker_idx + 1}, D${p.defender_idx + 1})`}</span>
                  <span className="font-mono" style={{ fontSize:'0.56rem', color:'var(--text-secondary)' }}>{`${p.attacker_payoff.toFixed(2)} / ${p.defender_payoff.toFixed(2)}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" style={{ flexShrink:0 }}>
          <div className="panel-header">
            <div className="panel-title"><Target size={14} />NASH TABLE</div>
            <span style={{ fontSize:'0.55rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
              {nashData?.equilibria?.length ?? 0} EQ
            </span>
          </div>
          {!nashData ? (
            <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.62rem', textAlign:'center', padding:'0.6rem 0.2rem' }}>
              Compute Nash to show equilibrium table.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
              {(nashData.equilibria || []).slice(0, 4).map((eq) => (
                <div key={eq.id} style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'0.35rem 0.45rem', background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.2rem' }}>
                    <span className="font-mono" style={{ fontSize:'0.55rem', color:'var(--accent-amber)' }}>EQ #{eq.id} · {eq.type}</span>
                    <span className="font-mono" style={{ fontSize:'0.55rem', color:'var(--text-muted)' }}>v={Number(eq.attacker_utility).toFixed(2)}</span>
                  </div>
                  <div className="font-mono" style={{ fontSize:'0.54rem', color:'var(--accent-red)' }}>
                    A: [{(eq.attacker_strategy || []).map(x => Number(x).toFixed(2)).join(', ')}]
                  </div>
                  <div className="font-mono" style={{ fontSize:'0.54rem', color:'var(--accent-cyan)' }}>
                    D: [{(eq.defender_strategy || []).map(x => Number(x).toFixed(2)).join(', ')}]
                  </div>
                </div>
              ))}
              <div className="font-mono" style={{ fontSize:'0.55rem', color:'var(--accent-green)' }}>
                Pure Nash profiles: {nashData.pure_nash_profiles?.length ?? 0}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDeleteOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ width:340, background:'var(--bg-panel)', border:'1px solid rgba(255,59,48,0.35)', borderRadius:8, padding:'0.9rem' }}>
            <div className="font-mono" style={{ color:'var(--accent-red)', fontSize:'0.7rem', marginBottom:'0.5rem', letterSpacing:'0.07em' }}>
              {t('dashboard.confirmDelete')}
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.68rem', marginBottom:'0.9rem', lineHeight:1.5 }}>
              {t('dashboard.deletePresetQuestion', { name: selectedPreset })}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
              <button className="btn btn-cyan" onClick={() => setConfirmDeleteOpen(false)}>{t('dashboard.cancel')}</button>
              <button className="btn btn-red" onClick={async () => { await removePreset(selectedPreset); setConfirmDeleteOpen(false); }}>{t('dashboard.delete')}</button>
            </div>
          </div>
        </div>
      )}

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
