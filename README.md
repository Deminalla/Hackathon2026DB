# Hackathon 2026 — plant sensor dashboard + ESP32

Monorepo for the hackathon demo: **React dashboard** (this folder) and **ESP32 firmware** ([ESP/](ESP/)).

| Part | Folder | Deploy |
|------|--------|--------|
| Web UI | `.` (Vite + React) | [Vercel](DEPLOY.md) + HiveMQ WebSocket |
| ESP32 | [ESP/](ESP/) | PlatformIO USB flash |

## Cloud demo (phone hotspot)

1. [HiveMQ Cloud](DEPLOY.md#1-create-a-cloud-mqtt-broker-hivemq-cloud) + credentials  
2. Flash ESP: [ESP/README.md](ESP/README.md)  
3. Deploy UI: [DEPLOY.md](DEPLOY.md#3-deploy-the-frontend-vercel)

Live app example: `https://hackathon2026db-esp.vercel.app` (if deployed).

## Local development

```bash
# Dashboard
npm install
cp .env.example .env.local
npm run dev

# Optional: local MQTT (from ESP/)
cd ESP && docker compose up -d
npm run proxy   # from repo root, if using local broker
```

## Repository layout

```text
├── ESP/                 # PlatformIO firmware (sensors, MQTT, speaker)
├── src/                 # React app
├── proxy/               # Local MQTT WebSocket bridge (dev only)
├── DEPLOY.md            # HiveMQ + Vercel walkthrough
└── .env.production.example
```
