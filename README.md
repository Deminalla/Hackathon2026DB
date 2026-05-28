# Hackathon 2026 — Plant sensor (ESP32 + dashboard)

Monorepo for the hackathon demo: **ESP32 firmware**, **React dashboard**, and a **hosted MQTT broker** (HiveMQ Cloud). The browser connects to the broker over **WSS** — no `npm run proxy` and no laptop Mosquitto in production.

## How it works (production)

```text
Phone hotspot / Wi‑Fi + internet
    ├── ESP32 ──MQTTS :8883────────► HiveMQ Cloud (hosted MQTT)
    └── Browser ──WSS :8884/mqtt──► HiveMQ Cloud
              ▲
              └── Dashboard (Vercel or `npm run preview`)
```

- **ESP** publishes sensor JSON to topic `darkside`.
- **Dashboard** subscribes to `darkside` and publishes controls to `sigita_liepe/the_force`.
- **Same broker credentials** in `ESP/include/secrets.h` and Vercel / `.env.production` (see [docs/MQTT.md](docs/MQTT.md)).

Optional **local dev** with Docker Mosquitto + `npm run proxy` is documented in [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) — not used for demo day.

## What’s in this repo

| Component | Location | Role |
|-----------|----------|------|
| **ESP32 firmware** | [`ESP/`](ESP/) | Sensors, MQTT (TLS), speaker, on-device web UI |
| **Web dashboard** | [`src/`](src/) | Live charts, sound / “lost my plant” |
| **MQTT setup guide** | [docs/MQTT.md](docs/MQTT.md) | Host broker on HiveMQ Cloud, env vars, Vercel |
| `proxy/` + `docker-compose.yml` | root | **Dev only** — local broker + WS bridge (not for deploy) |

## Quick start (hosted MQTT)

### 1. Host the MQTT broker

Create a free cluster on [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/), add username/password, and note:

| Use | Value |
|-----|--------|
| ESP | host, port **8883**, TLS on |
| Dashboard | `wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt` |

Step-by-step: **[docs/MQTT.md](docs/MQTT.md)**.

### 2. Flash the ESP32

```bash
cd ESP
cp include/secrets.example.h include/secrets.h
```

In `secrets.h`: Wi‑Fi, `MQTT_USE_TLS 1`, HiveMQ host, user, password. Then:

```bash
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

Details: [docs/ESP_FIRMWARE.md](docs/ESP_FIRMWARE.md) · Wiring: [docs/HARDWARE.md](docs/HARDWARE.md).

### 3. Configure and run the dashboard

```bash
cp .env.production.example .env.production
# Set VITE_MQTT_BROKER_URL to your wss://…:8884/mqtt URL and HiveMQ credentials
npm install
npm run build
npm run preview
```

**Deploy (Vercel):** import this repo, set the same `VITE_*` variables in the project settings, deploy. Do **not** run `npm run proxy`.  
→ [docs/MQTT.md — Deploy the dashboard](docs/MQTT.md#deploy-the-dashboard-vercel)

### 4. Verify

- Serial: Wi‑Fi connected, `MQTT connection... connected`
- Site: header **MQTT connected**, live `light_pct` and `temp`

Demo checklist: [docs/MQTT.md#demo-day-cloud-checklist](docs/MQTT.md#demo-day-cloud-checklist).

## MQTT topics (defaults)

| Direction | Topic | Payload |
|-----------|--------|---------|
| ESP → broker | `darkside` | `light_pct`, `temp`, `temp_raw`, … |
| Dashboard → ESP | `sigita_liepe/the_force` | `sound`, `lost_my_device`, optional `led_color` (retained) |

Override only if you change firmware **and** `VITE_MQTT_TOPIC_PATTERN` / `VITE_MQTT_SOUND_TOPIC`.

## Environment files

| File | When |
|------|------|
| `.env.production` / **Vercel env** | **Production** — WSS URL + HiveMQ credentials (`wss://…`) |
| `.env.local` | Optional local UI dev against hosted broker (same `wss://` URL, no proxy) |
| `ESP/include/secrets.h` | ESP Wi‑Fi + MQTTS (gitignored) |

Templates: `.env.production.example`, `ESP/include/secrets.example.h`.

**Do not commit** real passwords. `VITE_*` values are visible in the browser bundle — use demo-only credentials.

## Optional: local development (proxy + Mosquitto)

Only if you want a broker on your laptop instead of HiveMQ:

```bash
docker compose up -d
npm run proxy
npm run dev
```

ESP must use your PC’s LAN IP on port `1883` with `MQTT_USE_TLS 0`.  
→ [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)

## Repository layout

```text
Hackathon2026DB/
├── ESP/                    # PlatformIO firmware (src/, include/)
├── src/                    # React dashboard
├── docs/                   # Guides (start with MQTT.md)
├── .env.production.example # Hosted MQTT (WSS) for Vercel / build
├── proxy/                  # Dev-only — not used with hosted MQTT
└── docker-compose.yml      # Dev-only local Mosquitto
```

## Documentation

| Guide | Contents |
|--------|----------|
| [docs/MQTT.md](docs/MQTT.md) | **Hosted MQTT** (HiveMQ), Vercel env, troubleshooting |
| [docs/ESP_FIRMWARE.md](docs/ESP_FIRMWARE.md) | Build, flash, `secrets.h` |
| [docs/HARDWARE.md](docs/HARDWARE.md) | Pins, KY-001 / KY-018 |
| [docs/USAGE.md](docs/USAGE.md) | Dashboard controls |
| [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) | Proxy + Docker (optional) |

## Requirements

- **ESP:** [PlatformIO](https://platformio.org/), ESP32, USB cable  
- **Dashboard:** Node.js 18+, npm  
- **MQTT (demo / deploy):** [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/) account  
- **Deploy:** [Vercel](https://vercel.com) (or any static host for the Vite build)  
- **Docker:** only for optional local Mosquitto dev  
