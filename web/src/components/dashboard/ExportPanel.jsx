import React from 'react';

export default function ExportPanel({ syncZeroSum, setSyncZeroSum, exportResultsCsv, exportResultsPdf }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      <label className="font-mono" style={{ fontSize: '0.56rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <input type="checkbox" checked={syncZeroSum} onChange={(e) => setSyncZeroSum(e.target.checked)} />
        Auto-sync B = -A
      </label>
      <button className="btn btn-cyan" onClick={exportResultsCsv}>Export CSV</button>
      <button className="btn btn-cyan" onClick={exportResultsPdf}>Export PDF</button>
    </div>
  );
}
