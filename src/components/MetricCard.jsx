export default function MetricCard({ icon, label, value, unit, badge, caption }) {
  return (
    <article className="metric-card">
      <header className="metric-card-head">
        <span className="metric-card-icon">{icon}</span>
        <span className="metric-card-label">{label}</span>
      </header>
      <div className="metric-card-value">
        <span className="metric-card-number">{value}</span>
        {unit && <span className="metric-card-unit">{unit}</span>}
      </div>
      {badge && (
        <span className={`pill pill-${badge.tone}`}>{badge.label}</span>
      )}
      {caption && <p className="metric-card-caption">{caption}</p>}
    </article>
  );
}
