# Hardware wiring

Defaults match [`ESP/include/config.h`](../ESP/include/config.h).

## Pin map

| Module | Label | ESP32 GPIO | Notes |
|--------|-------|------------|--------|
| KY-018 light (LDR) | Signal | **36** | ADC only; do not use for temperature |
| KY-001 temperature | S (signal) | **32** | DS18B20 OneWire or analog NTC |
| RGB LED | R / G / B | **14 / 26 / 27** | Common cathode; firmware caps brightness |
| Speaker / buzzer | S (signal) | **25** | **Not** VCC on a GPIO |
| Status LED | — | **23** | On-board or external |

## KY-018 (light)

- **S** → GPIO 36  
- **+** → 3.3V  
- **-** → GND  

## KY-001 (temperature) — two board types

Both are sold as “KY-001”. Set `TEMP_USE_DS18B20` in `config.h`.

### Digital DS18B20 (recommended)

```c
constexpr bool TEMP_USE_DS18B20 = true;
constexpr int TEMP_ONEWIRE_PIN = 32;
```

| Pin on module | Connect to |
|---------------|------------|
| S | GPIO **32** |
| middle (+) | 3.3V |
| (-) | GND |

Serial at boot should show: `OneWire devices found: 1`.

### Analog NTC (thermistor PCB)

```c
constexpr bool TEMP_USE_DS18B20 = false;
constexpr int TEMP_ANALOG_PIN = 32;
```

Same **S → GPIO 32** wiring. Resistor is on the module PCB — do **not** enable `INPUT_PULLUP` on the ESP for that board.

If temperature reads wrong, try `TEMP_THERMISTOR_HIGH_SIDE` in `config.h` (this project uses `true` for the high-side divider module).

## Speaker (e.g. HW-508 / KY-012 style)

| Module | Connect to |
|--------|------------|
| S / IN | GPIO **25** |
| + / VCC | 3.3V (or 5V if required by module) |
| - / GND | GND |

Wiring **+** to a GPIO will not work.

## RGB LED

Common cathode: R→14, G→26, B→27, GND→GND.  
If colors are wrong, swap channel pins in `config.h`.

## Common mistakes

| Mistake | Result |
|---------|--------|
| Temp wire on GPIO **36** | Temperature tracks light (LDR pin) |
| DS18B20 mode with analog-only board | -127°C or invalid readings |
| No GND common between modules | Erratic ADC / OneWire |
| LED on KY-001 lit but wrong wiring | Power LED only; S must go to GPIO 32 |

After wiring changes, re-flash and watch serial: [ESP_FIRMWARE.md](ESP_FIRMWARE.md).
