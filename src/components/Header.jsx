function LeafIcon() {
  return (
    <svg className="header-leaf" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 3-9 12-11 0 7-3 17-12 18z" />
      <path d="M2 22c4-4 7-8 12-12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const BROKER_LABELS = {
  connecting:   { label: "Connecting…",      tone: "amber"  },
  connected:    { label: "Broker connected", tone: "green"  },
  reconnecting: { label: "Reconnecting…",    tone: "amber"  },
  disconnected: { label: "Disconnected",     tone: "muted"  },
  error:        { label: "Connection error", tone: "danger" },
};

function BrokerStatusPill({ status }) {
  const s = BROKER_LABELS[status] ?? BROKER_LABELS.disconnected;
  return (
    <span className={`header-status-pill broker-pill broker-${s.tone}`} title={`MQTT: ${s.label}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{s.label}</span>
    </span>
  );
}

export default function Header({ brokerStatus, onOpenSettings }) {
  return (
    <header className="header">
      <div className="header-brand">
        <LeafIcon />
        <h1>Plant light tracker</h1>
      </div>
      <div className="header-actions">
        {brokerStatus && <BrokerStatusPill status={brokerStatus} />}
        <button type="button" className="icon-btn" aria-label="Notifications"><BellIcon /></button>
        <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}><GearIcon /></button>
      </div>
    </header>
  );
}
