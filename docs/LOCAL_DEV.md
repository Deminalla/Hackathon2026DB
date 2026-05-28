# Local development (optional)

**Not used for demo day or Vercel.** For production, use [hosted HiveMQ](MQTT.md#option-a-hivemq-cloud-hosted) and connect the browser via `wss://` (no proxy).

This guide is only if you want a **local Mosquitto** broker on your laptop and the **WebSocket proxy** (`npm run proxy`). The ESP connects to your laptop's **LAN IP** on port 1883.

## 1. Install dependencies

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_TOPIC_PATTERN=darkside
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_MQTT_SOUND_TOPIC=sigita_liepe/the_force
```

## 2. Start Mosquitto

From the **repository root**:

```bash
docker compose up -d
```

Verify: broker listening on `localhost:1883`.

## 3. Start the MQTT WebSocket bridge

In a **second terminal** (repo root):

```bash
npm run proxy
```

You should see:

```text
[bridge] listening on ws://127.0.0.1:9001 → 127.0.0.1:1883
```

If Mosquitto runs on another host:

```bash
MQTT_UPSTREAM_HOST=192.168.1.10 MQTT_UPSTREAM_PORT=1883 npm run proxy
```

## 4. Start the dashboard

In a **third terminal**:

```bash
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

## 5. Configure and flash the ESP

Find your laptop's IP (e.g. `192.168.1.10` on Wi‑Fi).

`ESP/include/secrets.h`:

```c
#define MQTT_USE_TLS 0
#define MQTT_HOST "192.168.1.10"
#define MQTT_PORT 1883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""
```

Same Wi‑Fi for ESP and laptop.

```bash
cd ESP
pio run -e esp32dev -t upload
```

## 6. Verify

| Check | Expected |
|-------|----------|
| `npm run proxy` terminal | Shows bridge connections when dashboard opens |
| Dashboard header | MQTT **connected** |
| Device card | `light_pct` and `temp` updating |
| Mosquitto | `docker logs` or subscribe to `darkside` |

Subscribe test (optional):

```bash
docker exec -it $(docker ps -qf name=mosquitto) mosquitto_sub -t darkside -v
```

## Stop everything

```bash
# Ctrl+C on proxy and dev terminals
docker compose down
```

## Switching to cloud later

See [MQTT.md — HiveMQ Cloud](MQTT.md#option-a-hivemq-cloud-hosted).  
Use `.env.production` / Vercel env vars instead of `.env.local` + proxy.
