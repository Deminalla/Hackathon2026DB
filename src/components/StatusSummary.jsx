export default function StatusSummary({ counts, total }) {
  return (
    <div className="status-summary">
      <span className="status-summary-item">
        <span className="dot dot-green" aria-hidden="true" /> {counts.online} online
      </span>
      <span className="status-summary-sep" aria-hidden="true">|</span>
      <span className="status-summary-item">
        <span className="dot dot-amber" aria-hidden="true" /> {counts.warning} warning
      </span>
      <span className="status-summary-sep" aria-hidden="true">|</span>
      <span className="status-summary-item">
        <span className="dot dot-muted" aria-hidden="true" /> {counts.offline} offline
      </span>
      <span className="status-summary-sep" aria-hidden="true">|</span>
      <span className="status-summary-total">{total} devices total</span>
    </div>
  );
}
