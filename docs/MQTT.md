# MQTT broker hosting

The ESP32 and the browser dashboard must talk to the **same MQTT broker**. You can host it in the cloud (best for demo day) or on your laptop (best for development).

## Ports and protocols

| Client | Protocol | Typical port | Used when |
|--------|----------|--------------|-----------|
| ESP32 | MQTT over TLS (MQTTS) | **8883** | HiveMQ Cloud |
| ESP32 | Plain MQTT | **1883** | Local Mosquitto |
| Browser (production) | WebSocket over TLS (WSS) | **8884** path `/mqtt` | HiveMQ Cloud |
| Browser (local dev) | WebSocket (WS) | **9001** | `npm run proxy` → Mosquitto |

Browsers cannot open raw TCP port 1883. For local dev, this repo includes a small **WebSocket bridge** (`proxy/mqtt-bridge.mjs`) started with `npm run proxy`.

---

## Option A: HiveMQ Cloud (hosted)

Best for **demo day**: phone hotspot + internet. No laptop running Mosquitto.

### 1. Create a cluster

1. Sign up at [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/).
2. **Create cluster** → choose a region (e.g. EU).
3. Wait until the cluster status is **Running**.

### 2. Create credentials

1. Open the cluster → **Access Management**.
2. **Add credentials** → username + password (save them; password is shown once).
3. For a hackathon demo, one shared user is enough. Rotate after the event.

### 3. Connection details

From **Connection details** on the cluster page, note:

| Setting | ESP (`secrets.h`) | Dashboard (`.env.production` / Vercel) |
|---------|-------------------|----------------------------------------|
| Host | `MQTT_HOST` e.g. `xxxx.s1.eu.hivemq.cloud` | (in WebSocket URL) |
| TLS MQTT | `MQTT_PORT` **8883**, `MQTT_USE_TLS` **1** | — |
| WebSocket TLS | — | `wss://xxxx.s1.eu.hivemq.cloud:8884/mqtt` |

Example dashboard env (see `.env.production.example`):

```env
VITE_MQTT_BROKER_URL=wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt
VITE_MQTT_TOPIC_PATTERN=darkside
VITE_MQTT_USERNAME=your-username
VITE_MQTT_PASSWORD=your-password
VITE_MQTT_SOUND_TOPIC=sigita_liepe/the_force
```

Example ESP (`ESP/include/secrets.h`):

```c
#define MQTT_USE_TLS 1
#define MQTT_HOST "YOUR_CLUSTER.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "your-username"
#define MQTT_PASSWORD "your-password"
#define MQTT_TOPIC_PUBLISH "darkside"
#define MQTT_TOPIC_SUBSCRIBE "sigita_liepe/the_force"
```

Wi-Fi (phone hotspot or any network with internet):

```c
#define WIFI_SSID "YourNetwork"
#define WIFI_PASS "YourPassword"
```

### 4. Flash ESP and deploy UI

- ESP: [ESP_FIRMWARE.md](ESP_FIRMWARE.md)  
- UI: [Deploy the dashboard (Vercel)](#deploy-the-dashboard-vercel) below  

### 5. Test without the dashboard

Use [MQTT Explorer](https://mqtt-explorer.com/) or `mosquitto_sub`:

- Host: your cluster hostname  
- Port: **8883**, TLS on  
- Username / password: from step 2  
- Subscribe to topic: `darkside`  

With the ESP powered, you should see JSON like:

```json
{"light_pct":42,"temp":21.50,"temp_raw":2150}
```

---

## Option B: Local Mosquitto (Docker)

Best for **development** on your LAN.

### 1. Start the broker

From the **repository root**:

```bash
docker compose up -d
```

This runs Eclipse Mosquitto 2 on **port 1883** (anonymous allowed — LAN only).

Config: [`ESP/mosquitto/config/mosquitto.conf`](../ESP/mosquitto/config/mosquitto.conf).

Stop:

```bash
docker compose down
```

### 2. Start the WebSocket bridge

Browsers need WebSocket. From the repo root:

```bash
cp .env.example .env.local
npm run proxy
```

Default: listens on `ws://127.0.0.1:9001` and forwards to `127.0.0.1:1883`.

Override upstream (if Mosquitto runs on another machine):

```env
MQTT_UPSTREAM_HOST=192.168.1.10
MQTT_UPSTREAM_PORT=1883
```

Add these to `.env.local` or export before `npm run proxy`.

### 3. Configure the ESP for local MQTT

In `ESP/include/secrets.h`:

```c
#define MQTT_USE_TLS 0
#define MQTT_HOST "192.168.1.10"   // your laptop's LAN IP — not 127.0.0.1
#define MQTT_PORT 1883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""
```

The ESP must reach the laptop IP on the **same Wi‑Fi** as your phone/laptop.

### 4. Configure the dashboard

`.env.local`:

```env
VITE_MQTT_BROKER_URL=ws://localhost:9001
VITE_MQTT_TOPIC_PATTERN=darkside
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_MQTT_SOUND_TOPIC=sigita_liepe/the_force
```

```bash
npm run dev
```

Full sequence: [LOCAL_DEV.md](LOCAL_DEV.md).

---

## Deploy the dashboard (Vercel)

1. Push this repo to GitHub.
2. [Vercel](https://vercel.com) → **New Project** → import the repo.  
   **Root directory:** repository root (where `package.json` is).
3. **Environment variables** (Production) — copy from `.env.production.example` with your HiveMQ WSS URL and credentials.
4. Deploy. Open `https://your-project.vercel.app`.

Redeploy after changing env vars.

**CLI alternative:**

```bash
npm i -g vercel
vercel --prod
```

Set env vars in the Vercel dashboard or `vercel env add`.

**Local production build test:**

```bash
cp .env.production.example .env.production
# edit values
npm run build
npm run preview
```

Do **not** run `npm run proxy` for cloud mode.

---

## Demo day cloud checklist

| Step | Action |
|------|--------|
| 1 | HiveMQ cluster running; credentials created |
| 2 | `secrets.h` on ESP: TLS, host, user, pass, Wi-Fi |
| 3 | ESP flashed; serial shows Wi-Fi + MQTT connected |
| 4 | Vercel env vars set; site deployed |
| 5 | Phone hotspot on; ESP and laptop on hotspot (or ESP on hotspot, laptop on same internet) |
| 6 | Open Vercel URL → MQTT **connected**, live `temp` / `light_pct` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard **disconnected** | `VITE_MQTT_BROKER_URL` must be `wss://…:8884/mqtt` for HiveMQ; check user/pass; redeploy Vercel |
| ESP Wi‑Fi OK, **MQTT fails** | `MQTT_USE_TLS 1`, port `8883`, correct host and credentials |
| Works on `npm run dev`, not on HTTPS | Production needs `wss://`, not `ws://` |
| No data on card | Subscribe pattern must match publish topic: `darkside` |
| Local dev: no messages | Mosquitto running? Proxy running? ESP `MQTT_HOST` = laptop LAN IP? |
| ESP can't reach `localhost` | ESP must use your PC's **LAN IP**, not `127.0.0.1` |

---

## Security note

`VITE_*` variables are embedded in the browser JavaScript bundle. Anyone can read them. Acceptable for a hackathon demo; use dedicated credentials and rotate after the event.

Do not commit `secrets.h`, `.env.local`, or `.env.production` with real passwords.
