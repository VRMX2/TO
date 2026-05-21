export default function MetricCard({ label, value, hint, accent = 'var(--accent-cyan)' }) {
  return (
    <div className="metric-card" style={{ '--metric-accent': accent }}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {hint && <div className="metric-card__hint">{hint}</div>}
    </div>
  );
}
