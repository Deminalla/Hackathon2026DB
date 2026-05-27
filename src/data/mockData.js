// Mock device fleet. When the ESP32s are live, swap this module for a hook
// that returns the same shape — components stay unchanged.

const HOUR_SHAPE = [
  0.08, 0.05, 0.05, 0.05, 0.08, 0.18,
  0.35, 0.55, 0.75, 0.95, 1.00, 0.90,
  0.85, 0.95, 0.90, 0.85, 0.85, 0.88,
  0.80, 0.50, 0.25, 0.12, 0.06,
];

function makeHistory(currentLight, currentTemp) {
  const peak = Math.min(100, Math.max(currentLight * 1.3, currentLight + 15, 30));
  const hourly = HOUR_SHAPE.map((f, i) => ({
    t: `${String(i).padStart(2, "0")}:00`,
    lightPct: Math.max(0, Math.min(100, Math.round(peak * f))),
    tempC: Math.round(currentTemp - 2 + f * 4),
  }));
  hourly.push({ t: "now", lightPct: currentLight, tempC: currentTemp });
  return hourly;
}

function makeRecent(currentLight, currentTemp) {
  const lightShifts = [0, 3, 8, 12, 5];
  const tempShifts  = [0, 1, 2, 3, 1];
  const times = ["14:35", "14:30", "14:25", "14:20", "14:15"];
  return times.map((time, i) => ({
    time,
    lightPct: Math.max(0, Math.min(100, currentLight + lightShifts[i])),
    tempC: Math.max(0, currentTemp + tempShifts[i]),
  }));
}

const RAW_DEVICES = [
  { id: "monstera", name: "Monstera",    location: "Living room",        icon: "monstera", status: "online",  current: { lightPct: 64, tempC: 23 }, lastReadAgoMin: 2 },
  { id: "basil",    name: "Basil",       location: "Kitchen windowsill", icon: "sprout",   status: "warning", current: { lightPct: 82, tempC: 31 }, lastReadAgoMin: 1 },
  { id: "ficus",    name: "Ficus",       location: "Office desk",        icon: "tree",     status: "online",  current: { lightPct: 31, tempC: 21 }, lastReadAgoMin: 3 },
  { id: "snake",    name: "Snake plant", location: "Bedroom",            icon: "spike",    status: "online",  current: { lightPct: 14, tempC: 19 }, lastReadAgoMin: 4 },
  { id: "cactus",   name: "Cactus",      location: "Balcony",            icon: "cactus",   status: "offline", current: { lightPct: null, tempC: null }, lastReadAgoMin: null },
];

export const devices = RAW_DEVICES.map((d) => ({
  ...d,
  history24h: d.status === "offline" ? [] : makeHistory(d.current.lightPct, d.current.tempC),
  recent:     d.status === "offline" ? [] : makeRecent(d.current.lightPct, d.current.tempC),
}));

export const pollIntervalMin = 5;
