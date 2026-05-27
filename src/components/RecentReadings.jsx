import { classify } from "../utils/lightStatus";

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default function RecentReadings({ entries }) {
  return (
    <article className="recent-card">
      <header className="card-head">
        <ListIcon />
        <h2>Recent readings</h2>
      </header>
      <ul className="recent-list">
        {entries.map((e) => {
          const status = classify(e.lightPct);
          return (
            <li key={e.time} className="recent-row">
              <span className="recent-time">{e.time}</span>
              <span className="recent-value">
                {e.lightPct}% · {e.tempC}°C
              </span>
              <span className={`pill pill-${status.tone}`}>{status.label}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
