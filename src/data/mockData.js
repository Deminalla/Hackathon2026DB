// Mock readings stand-in for the ESP32 feed. When the device is live, replace
// this module with a hook that fetches the same shape — components stay unchanged.

export const current = { lightPct: 64, tempC: 23 };
export const lastReadAgoMin = 2;
export const pollIntervalMin = 5;

export const history24h = [
  { t: "00:00", lightPct: 5,  tempC: 21 },
  { t: "01:00", lightPct: 3,  tempC: 20 },
  { t: "02:00", lightPct: 3,  tempC: 20 },
  { t: "03:00", lightPct: 3,  tempC: 20 },
  { t: "04:00", lightPct: 5,  tempC: 20 },
  { t: "05:00", lightPct: 14, tempC: 20 },
  { t: "06:00", lightPct: 28, tempC: 21 },
  { t: "07:00", lightPct: 42, tempC: 22 },
  { t: "08:00", lightPct: 58, tempC: 23 },
  { t: "09:00", lightPct: 72, tempC: 24 },
  { t: "10:00", lightPct: 78, tempC: 25 },
  { t: "11:00", lightPct: 70, tempC: 26 },
  { t: "12:00", lightPct: 65, tempC: 27 },
  { t: "13:00", lightPct: 72, tempC: 28 },
  { t: "14:00", lightPct: 60, tempC: 27 },
  { t: "15:00", lightPct: 56, tempC: 26 },
  { t: "16:00", lightPct: 58, tempC: 25 },
  { t: "17:00", lightPct: 68, tempC: 25 },
  { t: "18:00", lightPct: 62, tempC: 24 },
  { t: "19:00", lightPct: 38, tempC: 23 },
  { t: "20:00", lightPct: 18, tempC: 22 },
  { t: "21:00", lightPct: 8,  tempC: 22 },
  { t: "22:00", lightPct: 4,  tempC: 21 },
  { t: "now",   lightPct: 64, tempC: 23 },
];

export const recent = [
  { time: "14:35", lightPct: 64, tempC: 23 },
  { time: "14:30", lightPct: 68, tempC: 24 },
  { time: "14:25", lightPct: 77, tempC: 26 },
  { time: "14:20", lightPct: 81, tempC: 29 },
  { time: "14:15", lightPct: 72, tempC: 27 },
];
