import { useCallback, useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { BROKER_URL, TOPIC_PATTERN, MQTT_USERNAME, MQTT_PASSWORD } from "../config";

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Subscribes to TOPIC_PATTERN and dispatches incoming messages into the device
// list via setDevices. Unknown device ids are dropped (discovery is opt-in:
// devices must be registered via the Add Device form with a matching Device ID).
//
// Returns:
//   status:  "connecting" | "connected" | "reconnecting" | "disconnected" | "error"
//   publish(topic, payload, opts?): JSON-encodes payload and forwards to the
//     underlying client. Default opts: { qos: 0, retain: false }. While the
//     broker is offline, mqtt.js buffers outbound messages and flushes them on
//     reconnect, so callers don't need to gate on `status`.
export function useMqttSensors(setDevices) {
  const [status, setStatus] = useState("connecting");
  const setDevicesRef = useRef(setDevices);
  const clientRef = useRef(null);

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
    clientRef.current = client;

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
      const raw = payload.toString();
      console.log("[mqtt] raw", { topic, raw });

      const segments = topic.split("/");
      if (segments.length < 3) {
        console.warn("[mqtt] drop: topic has fewer than 3 segments", { topic });
        return;
      }
      const deviceId = segments[segments.length - 1];

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.warn("[mqtt] drop: payload is not valid JSON", { topic, raw, err: err.message });
        return;
      }

      const lightPct = Number(parsed.light_pct);
      if (!Number.isFinite(lightPct)) {
        console.warn("[mqtt] drop: payload has no finite light_pct", { topic, parsed });
        return;
      }
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
      clientRef.current = null;
      client.end(true);
    };
  }, []);

  const publish = useCallback((topic, payload, opts = {}) => {
    const client = clientRef.current;
    if (!client) return false;
    const json = JSON.stringify(payload);
    client.publish(topic, json, { qos: 0, retain: false, ...opts }, (err) => {
      if (err) console.error("[mqtt] publish failed:", topic, err);
    });
    return true;
  }, []);

  return { status, publish };
}
