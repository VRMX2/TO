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
  gameMode,
  onGameModeChange,
  defenderMatrix,
  setDefenderMatrix,
  updateDefCell,
}) {
  const { t } = useI18n();
  const isGeneral = gameMode === 'general-sum';
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap:'wrap' }}>
        <span className="font-mono" style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('matrix.size')}</span>
        <select
          value={matrixSize}
          onChange={(e) => {
            const nextSize = Number(e.target.value);
            setMatrixSize(nextSize);
            const nextMatrix = resizeMatrix(payoffMatrix, nextSize);
            setPayoffMatrix(nextMatrix);
            if (isGeneral) {
              const nextDef = resizeMatrix(defenderMatrix || payoffMatrix.map(r => r.map(() => 0)), nextSize);
              setDefenderMatrix(nextDef);
            }
            fetchNash();
          }}
          style={{ background: 'var(--bg-base)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', outline: 'none', cursor: 'pointer' }}
        >
          {[2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{`${s}x${s}`}</option>)}
        </select>
        <button className="btn btn-cyan" onClick={fetchNash} disabled={loading.nash} style={{fontSize:'0.55rem', padding:'3px 8px'}}>
          {t('matrix.recompute')}
        </button>
        <button
          onClick={() => onGameModeChange(isGeneral ? 'zero-sum' : 'general-sum')}
          style={{ marginLeft:'auto', padding:'3px 8px', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:'0.5rem', cursor:'pointer', background: isGeneral ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)', border:`1px solid ${isGeneral ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: isGeneral ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          {isGeneral ? 'General-Sum' : 'Zero-Sum'}
        </button>
      </div>
      {isGeneral && (
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 200px' }}>
            <div className="font-mono" style={{ fontSize:'0.56rem', color:'var(--accent-red)', marginBottom:'0.25rem' }}>Attacker payoff</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ borderCollapse:'collapse' }}>
                <tbody>
                  {payoffMatrix.map((row, r) => (
                    <tr key={`a-row-${r}`}>
                      {row.map((v, c) => (
                        <td key={`a-cell-${r}-${c}`} style={{ padding:'2px' }}>
                          <input type="number" value={v}
                            onChange={(e) => updateCell(setPayoffMatrix, payoffMatrix, r, c, e.target.value)}
                            style={{ width:40, background:'var(--bg-base)', border:'1px solid rgba(255,59,48,0.2)', color:'var(--text-primary)', borderRadius:4, padding:'2px 4px', fontFamily:'var(--font-mono)', fontSize:'0.55rem' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ flex:'1 1 200px' }}>
            <div className="font-mono" style={{ fontSize:'0.56rem', color:'var(--accent-cyan)', marginBottom:'0.25rem' }}>Defender payoff</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ borderCollapse:'collapse' }}>
                <tbody>
                  {(defenderMatrix || payoffMatrix.map(r => r.map(() => 0))).map((row, r) => (
                    <tr key={`d-row-${r}`}>
                      {row.map((v, c) => (
                        <td key={`d-cell-${r}-${c}`} style={{ padding:'2px' }}>
                          <input type="number" value={v}
                            onChange={(e) => updateDefCell(setDefenderMatrix, defenderMatrix || payoffMatrix.map(r => r.map(() => 0)), r, c, e.target.value)}
                            style={{ width:40, background:'var(--bg-base)', border:'1px solid rgba(0,240,255,0.2)', color:'var(--text-primary)', borderRadius:4, padding:'2px 4px', fontFamily:'var(--font-mono)', fontSize:'0.55rem' }}
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
      )}
      {!isGeneral && (
        <div>
          <div className="font-mono" style={{ fontSize:'0.56rem', color:'var(--accent-red)', marginBottom:'0.25rem' }}>{t('matrix.payoff')}</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse' }}>
              <tbody>
                {payoffMatrix.map((row, r) => (
                  <tr key={`a-row-${r}`}>
                    {row.map((v, c) => (
                      <td key={`a-cell-${r}-${c}`} style={{ padding:'2px' }}>
                        <input
                          type="number"
                          value={v}
                          onChange={(e) => updateCell(setPayoffMatrix, payoffMatrix, r, c, e.target.value)}
                          style={{ width:44, background:'var(--bg-base)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-primary)', borderRadius:4, padding:'2px 4px', fontFamily:'var(--font-mono)', fontSize:'0.58rem' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
