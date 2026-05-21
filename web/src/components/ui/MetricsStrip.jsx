import MetricCard from './MetricCard';

export default function MetricsStrip({ items }) {
  return (
    <div className="metrics-strip page-transition delay-1">
      {items.map((item) => (
        <MetricCard key={item.label} {...item} />
      ))}
    </div>
  );
}
