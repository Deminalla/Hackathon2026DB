// Maps a 0–100 light_pct sensor reading to one of the sunlight categories used
// by plants.json. Used to suggest suitable plants for a room given its measured
// light, or to flag a mismatch between a plant's needs and its current spot.
//
// Note: "no sunlight" is an environment classification only — no plant in
// plants.json has it as a preference. Callers should treat that result as a
// "too dark for any plant" signal rather than a recommendation key.

export const SUNLIGHT_VALUES = [
  "no sunlight",
  "indirect sunlight",
  "partial sunlight",
  "full sunlight",
];

// Ordered low → high so a linear scan picks the first matching band.
// Ranges are inclusive on both ends; bands are contiguous (no gaps, no overlap).
export const SUNLIGHT_RANGES = [
  { category: "no sunlight",       min:  0, max: 10  },
  { category: "indirect sunlight", min: 11, max: 35  },
  { category: "partial sunlight",  min: 36, max: 70  },
  { category: "full sunlight",     min: 71, max: 100 },
];

// light_pct (0-100) → one of SUNLIGHT_VALUES, or null if input is invalid /
// out of range. Number.isFinite handles NaN, Infinity and non-number inputs.
export function sunlightFromLightPct(lightPct) {
  if (!Number.isFinite(lightPct) || lightPct < 0 || lightPct > 100) return null;
  for (const band of SUNLIGHT_RANGES) {
    if (lightPct >= band.min && lightPct <= band.max) return band.category;
  }
  return null;
}

// Inverse lookup: { min, max } of light_pct values that map to `sunlight`, or
// null if the category isn't recognized. Works for all four categories,
// including "no sunlight".
export function lightRangeForSunlight(sunlight) {
  const band = SUNLIGHT_RANGES.find((b) => b.category === sunlight);
  return band ? { min: band.min, max: band.max } : null;
}
