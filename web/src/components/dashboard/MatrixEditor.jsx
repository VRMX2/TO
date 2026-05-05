import React from 'react';

export default function MatrixEditor({
  matrixSize,
  setMatrixSize,
  resizeMatrix,
  setAttackerMatrix,
  setDefenderMatrix,
  fetchNash,
  loading,
  attackerMatrix,
  defenderMatrix,
  updateCell,
  syncZeroSum,
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Size</span>
        <select
          value={matrixSize}
          onChange={(e) => {
            const nextSize = Number(e.target.value);
            setMatrixSize(nextSize);
            setAttackerMatrix((m) => resizeMatrix(m, nextSize));
            setDefenderMatrix((m) => resizeMatrix(m, nextSize));
          }}
          style={{ background: 'var(--bg-base)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', outline: 'none', cursor: 'pointer' }}
        >
          {[2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{`${s}x${s}`}</option>)}
        </select>
        <button className="btn btn-cyan" onClick={fetchNash} disabled={loading.nash}>
          Recompute
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div>
          <div className="font-mono" style={{ fontSize: '0.56rem', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>Attacker A</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {attackerMatrix.map((row, r) => (
                  <tr key={`a-row-${r}`}>
                    {row.map((v, c) => (
                      <td key={`a-cell-${r}-${c}`} style={{ padding: '2px' }}>
                        <input
                          type="number"
                          value={v}
                          onChange={(e) => updateCell(setAttackerMatrix, attackerMatrix, r, c, e.target.value)}
                          style={{ width: 44, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: 4, padding: '2px 4px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="font-mono" style={{ fontSize: '0.56rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Defender B</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {defenderMatrix.map((row, r) => (
                  <tr key={`d-row-${r}`}>
                    {row.map((v, c) => (
                      <td key={`d-cell-${r}-${c}`} style={{ padding: '2px' }}>
                        <input
                          type="number"
                          value={v}
                          disabled={syncZeroSum}
                          onChange={(e) => updateCell(setDefenderMatrix, defenderMatrix, r, c, e.target.value)}
                          style={{ width: 44, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: 4, padding: '2px 4px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
