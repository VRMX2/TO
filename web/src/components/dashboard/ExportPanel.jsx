import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export default function ExportPanel({ syncZeroSum, setSyncZeroSum, exportResultsCsv, exportResultsPdf }) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <label className="font-mono" style={{ fontSize: '0.56rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <input type="checkbox" checked={syncZeroSum} onChange={(e) => setSyncZeroSum(e.target.checked)} />
        {t('matrix.autoSync')}
      </label>
      <button className="btn btn-cyan" onClick={exportResultsCsv}>{t('matrix.exportCsv')}</button>
      <button className="btn btn-cyan" onClick={exportResultsPdf}>{t('matrix.exportPdf')}</button>
    </div>
  );
}
