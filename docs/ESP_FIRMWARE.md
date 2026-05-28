# ESP32 firmware

Source: [`ESP/`](../ESP/) — PlatformIO project for **esp32dev**.

## Prerequisites

- [PlatformIO](https://platformio.org/) (VS Code extension recommended)
- USB data cable to the ESP32
- `secrets.h` created from the template (see below)

**Windows** — if `pio` is not on PATH:

```text
%USERPROFILE%\.platformio\penv\Scripts\pio.exe
```

## First-time setup

```bash
cd ESP
cp include/secrets.example.h include/secrets.h
```

Edit `include/secrets.h`:

| Define | Description |
|--------|-------------|
| `WIFI_SSID` / `WIFI_PASS` | Network the ESP joins |
| `MQTT_USE_TLS` | `1` for HiveMQ Cloud, `0` for local Mosquitto |
| `MQTT_HOST` / `MQTT_PORT` | Broker address |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | Empty strings for anonymous local broker |
| `MQTT_TOPIC_PUBLISH` | Default `darkside` |
| `MQTT_TOPIC_SUBSCRIBE` | Default `sigita_liepe/the_force` |

Pins and sensor mode: [`include/config.h`](../ESP/include/config.h) (no secrets).

Broker setup: [MQTT.md](MQTT.md).

## Build and upload

```bash
cd ESP
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

Expected serial output:

- Wi-Fi connected  
- `OneWire devices found: 1` (if DS18B20 mode)  
- `MQTT connection... connected`  
- Periodic `Publishing to darkside`

## OTA upload (optional)

Edit `upload_port` in [`platformio.ini`](../ESP/platformio.ini) under `[env:esp32dev_ota]`, then:

```bash
pio run -e esp32dev_ota -t upload
```

## What the firmware does

- Reads **light** (KY-018 on GPIO 36) and **temperature** (KY-001 on GPIO 32)  
- Publishes JSON to `darkside` every ~500 ms  
- Subscribes to `sigita_liepe/the_force` for sound, “lost my plant”, LED color  
- Serves a small **on-device web UI** at the ESP's IP (status + controls)  
- Drives RGB LED and speaker (Doom / Mario when enabled)

## Libraries (from `platformio.ini`)

- PubSubClient — MQTT  
- ArduinoJson — payloads  
- OneWire + DallasTemperature — DS18B20 (when enabled)

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Compile error: `secrets.h` | Copy `secrets.example.h` → `secrets.h` |
| Wi-Fi fails | Check SSID/password; 2.4 GHz only on many ESP boards |
| MQTT fails after Wi-Fi | See [MQTT.md](MQTT.md); verify TLS/port/credentials |
| Temp -127 or ~85°C | Wrong sensor mode or wiring — [HARDWARE.md](HARDWARE.md) |
| Temp follows light | Temperature pin must be **32**, not **36** |

Regenerate Doom song data (rare):

```bash
python ESP/tools/generate_doom_song.py
```
