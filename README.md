# Hackathon 2026 — Plant sensor (ESP32 + dashboard)

Everything for this demo lives in **this repository**: ESP32 firmware, React dashboard, local MQTT broker (Docker), cloud MQTT setup (HiveMQ), and step-by-step instructions.

## What you get

| Component | Location | Purpose |
|-----------|----------|---------|
| **ESP32 firmware** | [`ESP/`](ESP/) | Light + temperature sensors, RGB LED, speaker, MQTT publish |
| **Web dashboard** | [`src/`](src/) | Live charts, device card, sound / “lost my plant” controls |
| **MQTT bridge (dev)** | [`proxy/`](proxy/) | Browser WebSocket → TCP Mosquitto on your laptop |
| **Local broker** | [`docker-compose.yml`](docker-compose.yml) | Mosquitto on port `1883` (optional) |

## Choose your setup

| Goal | MQTT | Docs |
|------|------|------|
| **Demo day** (phone hotspot, no laptop broker) | [HiveMQ Cloud](docs/MQTT.md#option-a-hivemq-cloud-hosted) | [Full cloud walkthrough](docs/MQTT.md#demo-day-cloud-checklist) |
| **Development** at home (laptop broker) | [Docker Mosquitto](docs/MQTT.md#option-b-local-mosquitto-docker) | [Local dev guide](docs/LOCAL_DEV.md) |
| **Hardware / wiring** | — | [Hardware](docs/HARDWARE.md) |
| **Flash the ESP** | — | [ESP firmware](docs/ESP_FIRMWARE.md) |
| **Use the dashboard** | — | [Dashboard usage](docs/USAGE.md) |

## Quick start — cloud demo (recommended)

1. **MQTT broker** — Create a free [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/) cluster → username/password → note host and ports (`8883` ESP, `8884` browser).  
   → [Detailed MQTT hosting guide](docs/MQTT.md)

2. **ESP32** — From [`ESP/`](ESP/):
   ```bash
   cd ESP
   cp include/secrets.example.h include/secrets.h
   # Edit Wi-Fi + MQTT in secrets.h (see docs/ESP_FIRMWARE.md)
   pio run -e esp32dev -t upload
   ```

3. **Dashboard** — Copy env template and deploy (or run locally):
   ```bash
   cp .env.production.example .env.production
   # Fill in wss://…:8884/mqtt and HiveMQ credentials
   npm install && npm run build && npm run preview
   ```
   For Vercel: set the same `VITE_*` variables → [Deploy frontend](docs/MQTT.md#deploy-the-dashboard-vercel)

4. **Verify** — Open the site; header shows **MQTT connected**; card shows `light_pct` and `temp`.

## Quick start — local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local — use ws://localhost:9001 and your laptop LAN IP for ESP

docker compose up -d          # Mosquitto on :1883
npm run proxy                 # WebSocket bridge on :9001
npm run dev                   # Dashboard at http://localhost:5173
```

Flash the ESP with **local** MQTT settings (`MQTT_USE_TLS 0`, laptop IP, port `1883`).  
→ [Local dev guide](docs/LOCAL_DEV.md)

## Architecture

```text
                    ┌─────────────────────────────────────┐
                    │           MQTT broker               │
                    │  HiveMQ Cloud  OR  Mosquitto :1883  │
                    └──────────────▲──────────▲───────────┘
                                   │          │
              MQTTS :8883          │          │  WSS :8884 (cloud)
              or MQTT :1883        │          │  or ws://localhost:9001 (dev)
                                   │          │
                          ┌────────┴──┐   ┌───┴────────────┐
                          │  ESP32    │   │  Browser       │
                          │  sensors  │   │  React (Vite)  │
                          └───────────┘   └────────────────┘
```

**Topics (default):**

| Direction | Topic | Payload |
|-----------|--------|---------|
| ESP → broker | `darkside` | `{"light_pct", "temp", "temp_raw", …}` |
| Dashboard → ESP | `sigita_liepe/the_force` | `{"sound", "lost_my_device", "led_color?"}` (retained) |

## Repository layout

```text
Hackathon2026DB/
├── ESP/                      # PlatformIO — full firmware source
│   ├── src/main.cpp
│   ├── include/config.h
│   ├── include/secrets.example.h
│   └── platformio.ini
├── src/                      # React dashboard
├── proxy/mqtt-bridge.mjs     # Dev-only WS → TCP bridge
├── docker-compose.yml        # Local Mosquitto
├── docs/                     # Full documentation
│   ├── MQTT.md               # Broker hosting (cloud + local)
│   ├── ESP_FIRMWARE.md
│   ├── HARDWARE.md
│   ├── LOCAL_DEV.md
│   └── USAGE.md
├── .env.example              # Local dashboard env
└── .env.production.example   # Cloud / Vercel env
```

## Secrets (never commit)

| File | Contains |
|------|----------|
| `ESP/include/secrets.h` | Wi-Fi, MQTT host, username, password |
| `.env.local` / `.env.production` | Dashboard `VITE_MQTT_*` |

Templates: `ESP/include/secrets.example.h`, `.env.example`, `.env.production.example`.

## Documentation index

- [**MQTT broker hosting**](docs/MQTT.md) — HiveMQ Cloud, Mosquitto Docker, ports, credentials, troubleshooting  
- [**ESP firmware**](docs/ESP_FIRMWARE.md) — PlatformIO, flash, `secrets.h`, serial debug  
- [**Hardware**](docs/HARDWARE.md) — KY-018, KY-001, RGB, speaker pins  
- [**Local development**](docs/LOCAL_DEV.md) — proxy, env files, LAN IP for ESP  
- [**Dashboard usage**](docs/USAGE.md) — charts, settings, lost-my-plant alarm  

Legacy filename: [`DEPLOY.md`](DEPLOY.md) redirects to the MQTT cloud section.

## Requirements

- **ESP:** [PlatformIO](https://platformio.org/) (VS Code extension or CLI), USB cable, ESP32 dev board  
- **Dashboard:** Node.js 18+, npm  
- **Local MQTT:** [Docker](https://www.docker.com/) (optional)  
- **Cloud MQTT:** Free HiveMQ Cloud account (optional)
