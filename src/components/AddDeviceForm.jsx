import { useState } from "react";
import Header from "./Header";
import { PlantIcon } from "./PlantIcons";

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

const ICON_OPTIONS = [
  { value: "monstera", label: "Monstera / leafy"   },
  { value: "sprout",   label: "Herb / sprout"      },
  { value: "tree",     label: "Tree / ficus"       },
  { value: "spike",    label: "Snake plant"        },
  { value: "cactus",   label: "Cactus / succulent" },
];

export default function AddDeviceForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [icon, setIcon] = useState("monstera");
  const [deviceId, setDeviceId] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Required";
    if (!location.trim()) next.location = "Required";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit({
      name: name.trim(),
      location: location.trim(),
      icon,
      deviceId: deviceId.trim(),
    });
  }

  return (
    <div className="page">
      <form className="dashboard" onSubmit={handleSubmit} noValidate>
        <Header />
        <button type="button" className="back-btn" onClick={onCancel}>
          <ArrowLeftIcon /> Back to devices
        </button>

        <div className="detail-hero">
          <span className="detail-hero-icon"><PlantIcon variant={icon} /></span>
          <div className="detail-hero-text">
            <h2 className="detail-hero-title">Add a new plant</h2>
            <span className="detail-hero-location">Bind a sensor to start tracking</span>
          </div>
        </div>

        <div className="form-fields">
          <label className="form-field">
            <span className="form-label">Plant name</span>
            <input
              type="text"
              className={`form-input ${errors.name ? "form-input-error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aloe vera"
              autoFocus
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">Location</span>
            <input
              type="text"
              className={`form-input ${errors.location ? "form-input-error" : ""}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bedroom shelf"
            />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </label>

          <div className="form-field">
            <span className="form-label">Plant type</span>
            <div className="icon-picker" role="radiogroup" aria-label="Plant type">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={icon === opt.value}
                  aria-label={opt.label}
                  className={`icon-option ${icon === opt.value ? "icon-option-selected" : ""}`}
                  onClick={() => setIcon(opt.value)}
                >
                  <PlantIcon variant={opt.value} />
                </button>
              ))}
            </div>
          </div>

          <label className="form-field">
            <span className="form-label">
              Device ID <span className="form-label-hint">(optional)</span>
            </span>
            <input
              type="text"
              className="form-input"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="ESP32-XXXX"
            />
            <span className="form-hint">
              Leave blank if the sensor isn't paired yet — device starts offline.
            </span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Add device
          </button>
        </div>
      </form>
    </div>
  );
}
