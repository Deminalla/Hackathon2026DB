import { useCallback, useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { BROKER_URL, TOPIC_PATTERN, MQTT_USERNAME, MQTT_PASSWORD } from "../config";

function hhmmssms(date) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${pad(date.getMilliseconds(), 3)}`
  );
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

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.warn("[mqtt] drop: payload is not valid JSON", { topic, raw, err: err.message });
        return;
      }

      const lightPct = Number(parsed.light_pct);
      const tempC    = Number(parsed.temp);
      if (!Number.isFinite(lightPct) || !Number.isFinite(tempC)) {
        console.warn("[mqtt] drop: payload missing finite light_pct or temp", { topic, parsed });
        return;
      }

      console.log("[mqtt] message", { topic, payload: parsed });

      const now = new Date();
      const stamp = hhmmssms(now);

      // Single-card mode: every valid message updates every device in state
      // (there's only one). When we re-introduce multi-device routing we'll
      // bring back the deviceId match here.
      setDevicesRef.current((prev) =>
        prev.map((d) => {
          const prevHistory = d.history24h ?? [];
          return {
            ...d,
            status: "online",
            current: { lightPct, tempC },
            lastSeenAt: now.getTime(),
            recent: [
              { time: stamp, lightPct, tempC },
              ...(d.recent ?? []),
            ].slice(0, 5),
            history24h: [
              ...prevHistory.slice(-23),
              { t: "now", lightPct, tempC },
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
