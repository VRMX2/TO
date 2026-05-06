import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

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
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <input
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
        placeholder={t('presets.scenarioName')}
        style={{ width: 120, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}
      />
      <button className="btn btn-green" onClick={savePreset}>{t('presets.save')}</button>
      <select
        value={selectedPreset}
        onChange={(e) => {
          setSelectedPreset(e.target.value);
          loadPreset(e.target.value);
        }}
        style={{ background: 'var(--bg-base)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.58rem', outline: 'none', cursor: 'pointer' }}
      >
        <option value="">{t('presets.loadPreset')}</option>
        {savedPresets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
      </select>
      <button className="btn btn-cyan" onClick={renameCurrentPreset} disabled={!selectedPreset}>{t('presets.rename')}</button>
      <button className="btn btn-red" onClick={openDeleteConfirm} disabled={!selectedPreset}>{t('dashboard.delete')}</button>
      <button className="btn btn-cyan" onClick={exportScenarioJson}>{t('presets.exportJson')}</button>
      <button className="btn btn-cyan" onClick={openImportDialog}>{t('presets.importJson')}</button>
      <input ref={importInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImportScenario} />
    </div>
  );
}
