// Single placeholder card. Live readings arrive via MQTT and hydrate this
// device — see [src/lib/mqtt.js](../lib/mqtt.js). The mock fleet that used to
// live here has been retired; when we re-introduce multi-device routing,
// resurrect from git.

export const devices = [
  {
    id: "primary",
    deviceId: null,                  // routing no longer uses this
    name: "Cactus",
    location: "Living Room",
    icon: "cactus",
    status: "offline",
    current: { lightPct: null, tempC: null },
    lastSeenAt: null,
    lastReadAgoMin: null,
    history24h: [],
    recent: [],
  },
];

export const pollIntervalMin = 5;

export function createDevice({ name, location, icon, deviceId }) {
  const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const trimmedDeviceId = (deviceId || "").trim();
  // New devices start with no readings — the first MQTT message hydrates them.
  // Without a deviceId, the MQTT layer has nothing to route to, so the card
  // stays inert (and offline) until paired.
  return {
    id,
    deviceId: trimmedDeviceId || null,
    name,
    location,
    icon,
    status: "offline",
    current: { lightPct: null, tempC: null },
    lastSeenAt: null,
    lastReadAgoMin: null,
    history24h: [],
    recent: [],
  };
}
