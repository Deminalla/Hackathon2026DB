function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export default function AddDeviceCard({ onClick }) {
  return (
    <button type="button" className="add-device-card" onClick={onClick}>
      <span className="add-device-icon">
        <PlusIcon />
      </span>
      <span className="add-device-label">Add device</span>
    </button>
  );
}
