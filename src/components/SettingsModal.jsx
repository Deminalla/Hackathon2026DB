import { useEffect, useId, useRef } from "react";

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Toggle({ checked, onChange, label, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="visually-hidden">{label}</span>
    </label>
  );
}

export default function SettingsModal({
  open,
  soundEnabled,
  onSoundChange,
  lostMyDevice,
  onLostMyDeviceChange,
  onClose,
}) {
  const titleId = useId();
  const soundId = useId();
  const lostId = useId();
  const closeBtnRef = useRef(null);

  // Esc closes.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Move focus to the close button on open so Esc / Tab feel natural.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>Settings</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close"
            aria-label="Close settings"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>
        <div className="modal-body">
          <div className="setting-row">
            <label htmlFor={soundId} className="setting-label">
              <span className="setting-label-title">Sound</span>
              <span className="setting-label-hint">Plays alert tones on the ESP32 when readings cross a threshold.</span>
            </label>
            <Toggle
              id={soundId}
              checked={soundEnabled}
              onChange={onSoundChange}
              label="Sound"
            />
          </div>
          <div className="setting-row">
            <label htmlFor={lostId} className="setting-label">
              <span className="setting-label-title">I lost my plant</span>
              <span className="setting-label-hint">Triggers the locator buzz / LED on the ESP32 until turned off.</span>
            </label>
            <Toggle
              id={lostId}
              checked={lostMyDevice}
              onChange={onLostMyDeviceChange}
              label="I lost my plant"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
