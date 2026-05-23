import { useI18n } from '../../i18n/I18nProvider';

export default function ExportPanel({ exportResultsCsv, exportResultsPdf }) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <button className="btn btn-cyan" onClick={exportResultsCsv}>{t('matrix.exportCsv')}</button>
      <button className="btn btn-cyan" onClick={exportResultsPdf}>{t('matrix.exportPdf')}</button>
    </div>
  );
}
