import Header from "./Header";
import MetricCard from "./MetricCard";
import LightHistoryChart from "./LightHistoryChart";
import RecommendationCard from "./RecommendationCard";
import RecentReadings from "./RecentReadings";
import { PlantIcon } from "./PlantIcons";
import { classify } from "../utils/lightStatus";
import { pollIntervalMin } from "../data/mockData";

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

function ThermIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function tempBadge(tempC) {
  if (tempC < 18) return { tone: "muted",  label: "Cold"   };
  if (tempC <= 26) return { tone: "green",  label: "Normal" };
  if (tempC <= 30) return { tone: "amber",  label: "Warm"   };
  return { tone: "danger", label: "Hot" };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DeviceDetail({ device, brokerStatus, onBack, onDelete }) {
  const hasReadings =
    device.current?.lightPct != null && (device.history24h?.length ?? 0) > 0;

  return (
    <div className="page">
      <div className="dashboard">
        <Header brokerStatus={brokerStatus} />
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeftIcon /> Back to devices
        </button>
        <div className="detail-hero">
          <span className="detail-hero-icon"><PlantIcon variant={device.icon} /></span>
          <div className="detail-hero-text">
            <h2 className="detail-hero-title">{device.name}</h2>
            <span className="detail-hero-location"><PinIcon /> {device.location}</span>
          </div>
        </div>

        {!hasReadings ? (
          <div className="offline-notice">
            {device.deviceId
              ? `Waiting for the first reading from "${device.deviceId}"…`
              : "This device isn't paired with an ESP32 yet."}
          </div>
        ) : (
          <>
            <section className="metric-row">
              <MetricCard
                icon={<SunIcon />}
                label="Light level"
                value={device.current.lightPct}
                unit="%"
                badge={(() => {
                  const l = classify(device.current.lightPct);
                  return { tone: l.tone, label: capitalize(l.label) };
                })()}
              />
              <MetricCard
                icon={<ThermIcon />}
                label="Temperature"
                value={device.current.tempC}
                unit="°C"
                badge={tempBadge(device.current.tempC)}
              />
              <MetricCard
                icon={<ClockIcon />}
                label="Last read"
                value={device.lastReadAgoMin ?? "—"}
                unit={device.lastReadAgoMin != null ? "min" : ""}
                caption={
                  device.lastReadAgoMin != null
                    ? `ago · every ${pollIntervalMin} min`
                    : "no readings yet"
                }
              />
            </section>
            <LightHistoryChart data={device.history24h} />
            <section className="bottom-row">
              <RecommendationCard current={device.current} />
              <RecentReadings entries={device.recent} />
            </section>
          </>
        )}

        <div className="detail-actions">
          <button type="button" className="btn-danger" onClick={onDelete}>
            <TrashIcon /> Delete device
          </button>
        </div>
      </div>
    </div>
  );
}
