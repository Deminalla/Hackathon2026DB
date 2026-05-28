export function formatTempC(tempC) {
  if (tempC == null || !Number.isFinite(Number(tempC))) return "—";
  return `${Number(tempC).toFixed(2)}`;
}

export function formatTempCWithUnit(tempC) {
  const v = formatTempC(tempC);
  return v === "—" ? v : `${v}°C`;
}

export function formatLightPct(lightPct) {
  if (lightPct == null || !Number.isFinite(Number(lightPct))) return "—";
  return `${Math.round(Number(lightPct))}`;
}
