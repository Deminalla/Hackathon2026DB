import { PlantIcon } from "./PlantIcons";
import { classify } from "../utils/lightStatus";
import { formatLightPct, formatTempCWithUnit } from "../utils/formatSensor";

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--green)" />
      <polyline points="7 12 10.5 15 17 9" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusDot({ status }) {
  return <span className={`status-corner-dot status-corner-${status}`} aria-label={status} />;
}

function deviceBadge(device) {
  if (device.status === "offline") return { tone: "muted", label: "offline" };
  const light = classify(device.current.lightPct);
  const hot = device.current.tempC > 28;
  if (light.key === "dark") return { tone: "danger", label: "too dark" };
  if (light.key === "too-bright") {
    return { tone: "danger", label: hot ? "too bright + hot" : "too bright" };
  }
  if (light.key === "bright") {
    return { tone: hot ? "danger" : "amber", label: hot ? "bright + hot" : "bright" };
  }
  return { tone: "green", label: "good light" };
}

export default function DeviceCard({ device, selected, onClick }) {
  const badge = deviceBadge(device);
  const offline = device.status === "offline";
  const lightVal = device.current.lightPct == null ? "—" : `${formatLightPct(device.current.lightPct)}%`;
  const tempVal = formatTempCWithUnit(device.current.tempC);

  return (
    <button
      type="button"
      className={`device-card ${selected ? "device-card-selected" : ""} ${offline ? "device-card-offline" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="device-card-head">
        <div className="device-icon-wrap">
          <PlantIcon variant={device.icon} />
        </div>
        <div className="device-titles">
          <span className="device-name">{device.name}</span>
          <span className="device-location">
            <PinIcon /> {device.location}
          </span>
        </div>
        <span className="device-status-corner">
          {selected ? <CheckBadge /> : <StatusDot status={device.status} />}
        </span>
      </div>
      <div className="device-metrics">
        <div className="device-metric">
          <span className="device-metric-label">Light</span>
          <span className="device-metric-value">{lightVal}</span>
        </div>
        <div className="device-metric">
          <span className="device-metric-label">Temp</span>
          <span className="device-metric-value">{tempVal}</span>
        </div>
      </div>
      <span className={`pill pill-${badge.tone} device-badge`}>{badge.label}</span>
    </button>
  );
}
