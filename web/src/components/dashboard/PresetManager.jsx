import React from 'react';

export default function PresetManager({
  presetName,
  setPresetName,
  savePreset,
  selectedPreset,
  setSelectedPreset,
  loadPreset,
  savedPresets,
  renameCurrentPreset,
  openDeleteConfirm,
  exportScenarioJson,
  openImportDialog,
  importInputRef,
  onImportScenario,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <input
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
        placeholder="Scenario name"
        style={{ width: 120, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}
      />
      <button className="btn btn-green" onClick={savePreset}>Save</button>
      <select
        value={selectedPreset}
        onChange={(e) => {
          setSelectedPreset(e.target.value);
          loadPreset(e.target.value);
        }}
        style={{ background: 'var(--bg-base)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.58rem', outline: 'none', cursor: 'pointer' }}
      >
        <option value="">Load preset...</option>
        {savedPresets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
      </select>
      <button className="btn btn-cyan" onClick={renameCurrentPreset} disabled={!selectedPreset}>Rename</button>
      <button className="btn btn-red" onClick={openDeleteConfirm} disabled={!selectedPreset}>Delete</button>
      <button className="btn btn-cyan" onClick={exportScenarioJson}>Export JSON</button>
      <button className="btn btn-cyan" onClick={openImportDialog}>Import JSON</button>
      <input ref={importInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImportScenario} />
    </div>
  );
}
