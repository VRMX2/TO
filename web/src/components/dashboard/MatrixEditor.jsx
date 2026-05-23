import { useI18n } from '../../i18n/I18nProvider';

export default function MatrixEditor({
  matrixSize,
  setMatrixSize,
  resizeMatrix,
  fetchNash,
  loading,
  payoffMatrix,
  updateCell,
  setPayoffMatrix,
}) {
  const { t } = useI18n();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('matrix.size')}</span>
        <select
          value={matrixSize}
          onChange={(e) => {
            const nextSize = Number(e.target.value);
            const nextMatrix = resizeMatrix(payoffMatrix, nextSize);
            setMatrixSize(nextSize);
            setPayoffMatrix(nextMatrix);
            fetchNash();
          }}
          style={{ background: 'var(--bg-base)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', outline: 'none', cursor: 'pointer' }}
        >
          {[2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{`${s}x${s}`}</option>)}
        </select>
        <button className="btn btn-cyan" onClick={fetchNash} disabled={loading.nash}>
          {t('matrix.recompute')}
        </button>
      </div>
      <div>
        <div className="font-mono" style={{ fontSize: '0.56rem', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>{t('matrix.payoff')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {payoffMatrix.map((row, r) => (
                <tr key={`a-row-${r}`}>
                  {row.map((v, c) => (
                    <td key={`a-cell-${r}-${c}`} style={{ padding: '2px' }}>
                      <input
                        type="number"
                        value={v}
                        onChange={(e) => updateCell(setPayoffMatrix, payoffMatrix, r, c, e.target.value)}
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
    </>
  );
}
