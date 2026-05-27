// Thresholds match the dashboard legend: Dark <20%, Good 20–70%, Bright >70%.
// "too-bright" splits off above 80% so we can flag heat-stress risk in the UI.

export const STATUS = {
  dark:      { key: "dark",       label: "dark",       tone: "muted"  },
  good:      { key: "good",       label: "good",       tone: "green"  },
  bright:    { key: "bright",     label: "bright",     tone: "amber"  },
  tooBright: { key: "too-bright", label: "too bright", tone: "danger" },
};

export function classify(lightPct) {
  if (lightPct < 20) return STATUS.dark;
  if (lightPct <= 70) return STATUS.good;
  if (lightPct <= 80) return STATUS.bright;
  return STATUS.tooBright;
}

// LED indicator color sent to the ESP32 to mirror the dashboard's status:
//   "blue"  = not enough light (dark)
//   "green" = enough (good/bright)
//   "red"   = too much (too-bright)
// Reuses classify() so the bands stay in sync with the rest of the UI.
export function ledColorFromLight(lightPct) {
  if (lightPct == null || !Number.isFinite(lightPct)) return null;
  const status = classify(lightPct);
  if (status.key === "dark") return "blue";
  if (status.key === "too-bright") return "red";
  return "green";
}
