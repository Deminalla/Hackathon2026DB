import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { BROKER_URL, TOPIC_PATTERN, MQTT_USERNAME, MQTT_PASSWORD } from "../config";

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Subscribes to TOPIC_PATTERN and dispatches incoming messages into the device
// list via setDevices. Unknown device ids are dropped (discovery is opt-in:
// devices must be registered via the Add Device form with a matching Device ID).
//
// Returns a status string suitable for the header indicator:
//   "connecting" | "connected" | "reconnecting" | "disconnected" | "error"
export function useMqttSensors(setDevices) {
  const [status, setStatus] = useState("connecting");
  const setDevicesRef = useRef(setDevices);

  // Keep the ref pointing at the latest setter so the message handler (registered
  // only once) always uses the current state-setter closure.
  useEffect(() => {
    setDevicesRef.current = setDevices;
  }, [setDevices]);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
      reconnectPeriod: 3000,
      connectTimeout: 8000,
      clean: true,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    });

    client.on("connect", () => {
      setStatus("connected");
      client.subscribe(TOPIC_PATTERN, { qos: 0 }, (err) => {
        if (err) console.error("[mqtt] subscribe failed:", err);
      });
    });
    client.on("reconnect", () => setStatus("reconnecting"));
    client.on("close",     () => setStatus("disconnected"));
    client.on("offline",   () => setStatus("disconnected"));
    client.on("error",     (err) => {
      console.error("[mqtt] error:", err);
      setStatus("error");
    });

    client.on("message", (topic, payload) => {
      const segments = topic.split("/");
      if (segments.length < 3) return;
      const deviceId = segments[segments.length - 1];

      let parsed;
      try {
        parsed = JSON.parse(payload.toString());
      } catch {
        return; // bad JSON → drop
      }

      const lightPct = Number(parsed.light_pct);
      if (!Number.isFinite(lightPct)) return;          // light_pct is required
      const rawTemp = Number(parsed.temp);
      const tempC = Number.isFinite(rawTemp) ? rawTemp : null;

      console.log("[mqtt] message", { topic, deviceId, payload: parsed });

      const now = new Date();
      const stamp = hhmm(now);

      setDevicesRef.current((prev) =>
        prev.map((d) => {
          if (d.deviceId !== deviceId) return d;
          const prevHistory = d.history24h ?? [];
          // Preserve last-known temp if this message doesn't include one.
          const effectiveTemp = tempC ?? d.current?.tempC ?? null;
          return {
            ...d,
            status: "online",
            current: { lightPct, tempC: effectiveTemp },
            lastSeenAt: now.getTime(),
            recent: [
              { time: stamp, lightPct, tempC: effectiveTemp },
              ...(d.recent ?? []),
            ].slice(0, 5),
            history24h: [
              ...prevHistory.slice(-23),
              { t: "now", lightPct, tempC: effectiveTemp },
            ],
          };
        }),
      );
    });

    return () => {
      client.end(true);
    };
  }, []);

  return status;
}
