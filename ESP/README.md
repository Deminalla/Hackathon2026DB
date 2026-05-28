# ESP32 firmware (PlatformIO)

Plant sensor node: light (KY-018), temperature (KY-001), RGB LED, speaker, and MQTT to the same broker as the React dashboard in the repo root.

## Quick start

1. Install [PlatformIO](https://platformio.org/) (VS Code extension or CLI).
2. Copy secrets template and fill in Wi‑Fi + MQTT:

   ```bash
   cd ESP
   cp include/secrets.example.h include/secrets.h
   ```

3. Build and upload (USB):

   ```bash
   pio run -e esp32dev -t upload
   pio device monitor -b 115200
   ```

   On Windows, if `pio` is not on PATH:

   ```text
   %USERPROFILE%\.platformio\penv\Scripts\pio.exe run -e esp32dev -t upload
   ```

4. Deploy the dashboard from the parent folder — see [DEPLOY.md](../DEPLOY.md).

## Wiring (summary)

| Module | Signal pin | Notes |
|--------|------------|--------|
| KY-018 light (LDR) | GPIO **36** | `LDR_PIN` in `include/config.h` |
| KY-001 temperature | GPIO **32** | `TEMP_ONEWIRE_PIN` — **not** GPIO 36 |
| RGB LED | R=14, G=26, B=27 | Common cathode, max duty 50 |
| Speaker / buzzer | GPIO **25** | Signal to `S`; VCC to 3.3V; GND to GND |
| Status LED | GPIO 23 | Optional blink |

### KY-001: two different boards

Both are sold as “KY-001”. Set `TEMP_USE_DS18B20` in `include/config.h`:

| Board | `TEMP_USE_DS18B20` | Wiring |
|-------|--------------------|--------|
| **DS18B20** (digital, OneWire) | `true` | S → GPIO 32, middle → 3.3V, (-) → GND |
| **NTC analog** | `false` | Same signal pin; firmware uses ADC + Steinhart |

At boot, serial should show `OneWire devices found: 1` for DS18B20. If it shows `0`, switch to analog mode or check wiring.

Do **not** use `INPUT_PULLUP` on the ESP for the 3-pin KY-001 PCB (resistor is on the module).

## MQTT topics

Configured in `include/secrets.h` (defaults in `secrets.example.h`):

| Direction | Topic | Purpose |
|-----------|--------|---------|
| ESP → broker | `darkside` | JSON: `light_pct`, `temp`, `temp_raw`, … |
| Broker → ESP | `sigita_liepe/the_force` | JSON: `sound`, `lost_my_device`, optional `led_color` |

Must match `VITE_MQTT_*` in the dashboard `.env` files.

## Cloud vs local broker

| Mode | `secrets.h` | Dashboard |
|------|-------------|-----------|
| **Cloud (demo day)** | `MQTT_USE_TLS 1`, HiveMQ host/port 8883 | Vercel + `wss://…:8884/mqtt` — [DEPLOY.md](../DEPLOY.md) |
| **Local dev** | `MQTT_USE_TLS 0`, laptop IP, port 1883 | `npm run proxy` + `docker compose up` in this folder |

Local Mosquitto:

```bash
docker compose up -d
```

## Configuration files

| File | Role |
|------|------|
| `platformio.ini` | Board `esp32dev`, libraries (PubSubClient, DallasTemperature, …) |
| `include/config.h` | Pins, sensor mode, intervals (no secrets) |
| `include/secrets.h` | Wi‑Fi, MQTT host/credentials — **gitignored**, never commit |
| `src/main.cpp` | Wi‑Fi, TLS MQTT, sensors, web UI on device |
| `src/speaker.cpp` | Melodies; “lost my plant” overrides sound-off |

## OTA upload (optional)

`platformio.ini` defines `env:esp32dev_ota`. Set `upload_port` to the ESP IP, then:

```bash
pio run -e esp32dev_ota -t upload
```

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Temp tracks light / flat line | Temp pin must be **32**, not 36 (LDR) |
| Temp -127 or ~85°C | DS18B20 not connected or wrong mode |
| MQTT fails, Wi‑Fi OK | TLS, port 8883, username/password in `secrets.h` |
| No sound from dashboard | Publish to `sigita_liepe/the_force`; enable sound or “lost my plant” |

Full cloud checklist: [DEPLOY.md](../DEPLOY.md).
