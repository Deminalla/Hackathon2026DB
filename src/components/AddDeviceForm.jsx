import { useState } from "react";
import Header from "./Header";
import { PlantIcon } from "./PlantIcons";
import plants from "../data/plants.json";

// Unique plant names sourced from the plant database. Computed once at module
// load. Users can pick from this list (datalist autocomplete) or type a custom
// name — the input stays freeform.
const PLANT_NAMES = Array.from(new Set(plants.map((p) => p.name))).sort((a, b) =>
  a.localeCompare(b),
);

// Common rooms / spots where someone might place a plant. Same freeform-with-
// suggestions pattern as PLANT_NAMES — users can pick or type a custom location.
const LOCATIONS = [
  "Balcony",
  "Bathroom",
  "Bedroom",
  "Bookshelf",
  "Conservatory",
  "Dining room",
  "Garage",
  "Garden",
  "Greenhouse",
  "Hallway",
  "Kitchen",
  "Kitchen windowsill",
  "Living room",
  "Office",
  "Office desk",
  "Patio",
  "Porch",
  "Study",
  "Sunroom",
  "Terrace",
  "Window sill",
];

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

export default function AddDeviceForm({ brokerStatus, onSubmit, onCancel, onOpenSettings }) {
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
        <Header brokerStatus={brokerStatus} onOpenSettings={onOpenSettings} />
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
              list="plant-name-suggestions"
              className={`form-input ${errors.name ? "form-input-error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Start typing or pick from the list…"
              autoComplete="off"
              autoFocus
            />
            <datalist id="plant-name-suggestions">
              {PLANT_NAMES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </label>

          <label className="form-field">
            <span className="form-label">Location</span>
            <input
              type="text"
              list="location-suggestions"
              className={`form-input ${errors.location ? "form-input-error" : ""}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Pick a room or type a custom spot…"
              autoComplete="off"
            />
            <datalist id="location-suggestions">
              {LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
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
