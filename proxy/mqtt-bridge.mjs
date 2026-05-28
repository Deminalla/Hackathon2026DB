// Tiny WebSocket→TCP MQTT bridge.
//
// Browsers can't speak raw TCP MQTT (port 1883). This proxy accepts MQTT-over-
// WebSocket from the browser and pipes the bytes to a real TCP MQTT broker.
// It is a *transport translator* only — the MQTT CONNECT/PUBLISH/SUBSCRIBE
// packets pass through unchanged, including username/password and retained
// flags. The broker handles everything MQTT-level.
//
// Usage:
//   npm run proxy
//
// Env (all optional, sensible defaults shown):
//   BRIDGE_PORT          9001         local port the bridge listens on
//   BRIDGE_HOST          127.0.0.1    interface to bind (localhost-only by default)
//   MQTT_UPSTREAM_HOST   127.0.0.1    real broker host (Docker Mosquitto)
//   MQTT_UPSTREAM_PORT   1883         real broker TCP port

import net from "node:net";
import { WebSocketServer } from "ws";

const BRIDGE_PORT        = Number(process.env.BRIDGE_PORT)        || 9001;
const BRIDGE_HOST        =        process.env.BRIDGE_HOST          || "127.0.0.1";
const MQTT_UPSTREAM_HOST =        process.env.MQTT_UPSTREAM_HOST   || "127.0.0.1";
const MQTT_UPSTREAM_PORT = Number(process.env.MQTT_UPSTREAM_PORT) || 1883;

const wss = new WebSocketServer({
  host: BRIDGE_HOST,
  port: BRIDGE_PORT,
  // mqtt.js sends "mqtt" (and historically "mqttv3.1"). Accept either.
  handleProtocols: (protocols) => {
    if (protocols.has("mqtt")) return "mqtt";
    if (protocols.has("mqttv3.1")) return "mqttv3.1";
    return false; // reject the upgrade — refuse to look like a generic WS endpoint
  },
});

let nextId = 1;
let active = 0;

wss.on("listening", () => {
  console.log(
    `[bridge] listening on ws://${BRIDGE_HOST}:${BRIDGE_PORT} → ${MQTT_UPSTREAM_HOST}:${MQTT_UPSTREAM_PORT}`,
  );
});

wss.on("connection", (ws, req) => {
  const id = nextId++;
  const peer = req.socket.remoteAddress;
  active++;
  console.log(`[bridge] #${id} ws open from ${peer} (active: ${active})`);

  const tcp = net.createConnection({
    host: MQTT_UPSTREAM_HOST,
    port: MQTT_UPSTREAM_PORT,
  });

  // Pipe WS → TCP.
  ws.on("message", (data, isBinary) => {
    // mqtt.js always sends binary frames; if isBinary is false, the byte is
    // still in `data` as a Buffer (ws gives us Buffer either way).
    if (!isBinary) {
      // Defensive — shouldn't happen with mqtt.js, but log so we can spot it.
      console.warn(`[bridge] #${id} non-binary frame received, forwarding anyway`);
    }
    tcp.write(data);
  });

  // Pipe TCP → WS.
  tcp.on("data", (chunk) => {
    if (ws.readyState === ws.OPEN) ws.send(chunk, { binary: true });
  });

  // Lifecycle / cleanup.
  ws.on("close", (code) => {
    active--;
    console.log(`[bridge] #${id} ws closed (code ${code}, active: ${active})`);
    tcp.destroy();
  });
  tcp.on("close", () => {
    console.log(`[bridge] #${id} tcp closed`);
    if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) ws.close();
  });
  ws.on("error", (err) => {
    console.error(`[bridge] #${id} ws error: ${err.message}`);
    tcp.destroy();
  });
  tcp.on("error", (err) => {
    console.error(`[bridge] #${id} tcp error: ${err.message}`);
    if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) ws.close();
  });
});

wss.on("error", (err) => {
  console.error(`[bridge] server error: ${err.message}`);
  process.exit(1);
});

// Clean shutdown on Ctrl-C so sockets don't dangle on restart.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\n[bridge] ${sig} received, shutting down`);
    wss.close(() => process.exit(0));
  });
}
