# Cloud deploy: hosted UI + MQTT

Use this for demo day with a **phone hotspot**: the ESP and any browser only need Wi‑Fi + internet. No laptop Mosquitto, no `npm run proxy`.

```
Phone hotspot (internet)
    ├── ESP32 ──MQTTS :8883──► HiveMQ Cloud
    └── Laptop/phone browser ──WSS :8884──► HiveMQ Cloud
              ▲
              └── static UI from Vercel (or similar)
```

## 1. Create a cloud MQTT broker (HiveMQ Cloud)

1. Sign up at [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/).
2. **Create cluster** → pick a region close to you (e.g. EU).
3. Open the cluster → **Access Management** → create credentials (username + password).
4. Open **Connection details** and note:
   - **Host** (e.g. `xxxx.s1.eu.hivemq.cloud`)
   - **MQTT over TLS** port: `8883` (ESP)
   - **WebSocket over TLS** port: `8884`, path `/mqtt` (browser)

WebSocket URL for the dashboard:

```text
wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt
```

## 2. Flash the ESP32

Firmware lives in **[ESP/](ESP/)** (PlatformIO). See [ESP/README.md](ESP/README.md) for wiring and pins.

```bash
cd ESP
cp include/secrets.example.h include/secrets.h
# edit include/secrets.h
pio run -e esp32dev -t upload
```

Edit `include/secrets.h` (copy from `secrets.example.h` if needed):

```c
#define MQTT_USE_TLS 1
#define MQTT_HOST "YOUR_CLUSTER.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "your-hivemq-username"
#define MQTT_PASSWORD "your-hivemq-password"
```

Also set **phone hotspot** Wi‑Fi:

```c
#define WIFI_SSID "YourHotspotName"
#define WIFI_PASS "YourHotspotPassword"
```

Keep topics as-is unless you change firmware:

```c
#define MQTT_TOPIC_PUBLISH "darkside"
#define MQTT_TOPIC_SUBSCRIBE "sigita_liepe/the_force"
```

Then run `pio run -e esp32dev -t upload` from `ESP/`. Serial monitor: Wi‑Fi connected, then `MQTT connection... connected`.

## 3. Deploy the frontend (Vercel)

1. Push `Hackathon2026DB` to GitHub (or import this folder in Vercel).
2. In Vercel → **New Project** → import repo → set **Root Directory** to `Hackathon2026DB` if the repo is the parent `esp` folder.
3. **Environment Variables** (Production) — same as `.env.production.example`:

| Name | Example |
|------|---------|
| `VITE_MQTT_BROKER_URL` | `wss://xxxx.s1.eu.hivemq.cloud:8884/mqtt` |
| `VITE_MQTT_TOPIC_PATTERN` | `darkside` |
| `VITE_MQTT_USERNAME` | (HiveMQ username) |
| `VITE_MQTT_PASSWORD` | (HiveMQ password) |
| `VITE_MQTT_SOUND_TOPIC` | `sigita_liepe/the_force` |

4. Deploy. Open the `https://….vercel.app` URL.

**Local production test** before deploy:

```bash
cp .env.production.example .env.production
# edit .env.production with real values
npm run build
npm run preview
```

No `npm run proxy` for cloud mode.

## 4. Demo day checklist

| Step | Action |
|------|--------|
| 1 | Phone hotspot on (with mobile data) |
| 2 | ESP powered — connects to hotspot + HiveMQ |
| 3 | Open deployed `https://…vercel.app` on laptop or projector |
| 4 | Header shows MQTT **connected**; card shows live `light_pct` / `temp` |

Laptop is optional (only for serial debug or re-flash).

## 5. Verify MQTT without the UI

From any machine with internet (MQTT Explorer, or):

```bash
# subscribe (replace host/user/pass)
mosquitto_sub -h YOUR_CLUSTER.s1.eu.hivemq.cloud -p 8883 \
  --cafile /path/to/ca.crt -u USER -P PASS -t darkside -v
```

You should see JSON like `{"light_pct":42,"temp":21.5}` when the ESP is running.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard disconnected | Wrong `VITE_MQTT_BROKER_URL` (must include `/mqtt` on HiveMQ), or wrong user/pass; redeploy after env change |
| ESP Wi‑Fi OK, MQTT fails | `MQTT_HOST` / port `8883` / `MQTT_USE_TLS 1` / credentials in `secrets.h` |
| Works on laptop, not on HTTPS site | Broker URL must be `wss://`, not `ws://` |
| No data on card | Topic must be `darkside`; payload needs `light_pct` and `temp` |

## Security note

`VITE_*` values are visible in the browser bundle. HiveMQ credentials are fine for a hackathon demo; use per-demo credentials and rotate after.

## Local dev vs cloud

| Mode | Env file | Proxy | Mosquitto |
|------|----------|-------|-----------|
| Local | `.env.local` | `npm run proxy` | `docker compose up` |
| Cloud | Vercel env / `.env.production` | not used | not used |
