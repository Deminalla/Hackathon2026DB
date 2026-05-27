import { classify } from "../utils/lightStatus";

function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-3 6-1 1-2 2-2 3H10c0-1-1-2-2-3-1-1-3-3-3-6a7 7 0 0 1 7-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function primaryMessage(status) {
  switch (status.key) {
    case "dark":
      return { title: "Too dark.", body: " Move the plant closer to a window." };
    case "bright":
      return { title: "Quite bright.", body: " Consider sheer shade during peak sun." };
    case "too-bright":
      return { title: "Too much sun.", body: " Move out of direct light to avoid scorch." };
    case "good":
    default:
      return { title: "Light is optimal.", body: " No action needed for now." };
  }
}

export default function RecommendationCard({ current }) {
  const status = classify(current.lightPct);
  const msg = primaryMessage(status);
  const goodTone = status.key === "good";

  return (
    <article className="reco-card">
      <header className="card-head">
        <BulbIcon />
        <h2>Recommendation</h2>
      </header>
      <ul className="reco-list">
        <li>
          <span className={`reco-icon ${goodTone ? "reco-icon-good" : "reco-icon-warn"}`}>
            <CheckIcon />
          </span>
          <p><strong>{msg.title}</strong>{msg.body}</p>
        </li>
        <li>
          <span className="reco-icon reco-icon-warn"><ClockIcon /></span>
          <p><strong>Peak sun at 12–14h.</strong> Watch for heat stress.</p>
        </li>
      </ul>
      <div className="threshold-pills">
        <span className="pill pill-muted">Dark &lt;20%</span>
        <span className="pill pill-muted">Good 20–70%</span>
        <span className="pill pill-muted">Bright &gt;70%</span>
      </div>
    </article>
  );
}
