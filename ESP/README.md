# ESP32 firmware (PlatformIO)

Full **source code** for the sensor node: `src/main.cpp`, `src/speaker.cpp`, headers in `include/`.

## Build

```bash
cp include/secrets.example.h include/secrets.h
# edit secrets.h — Wi-Fi + MQTT
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

## Documentation

All setup, wiring, and MQTT configuration:

- [**ESP firmware**](../docs/ESP_FIRMWARE.md) — flash, secrets, troubleshooting  
- [**Hardware**](../docs/HARDWARE.md) — pins, KY-001 / KY-018  
- [**MQTT hosting**](../docs/MQTT.md) — HiveMQ Cloud or local Mosquitto  
- [**Project README**](../README.md) — full monorepo overview  

`secrets.h` is gitignored — never commit it.
