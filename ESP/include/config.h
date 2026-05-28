#pragma once

// MQTT_USE_TLS, MQTT_USERNAME, MQTT_PASSWORD — set in secrets.h only.

constexpr int LED_PIN_23 = 23;
constexpr int LDR_PIN = 36;
constexpr int RGB_RED = 14;
constexpr int RGB_GREEN = 26;
constexpr int RGB_BLUE = 27;
constexpr int RGB_MAX = 50;

// Two different boards are sold as "KY-001":
//   DS18B20 (digital) -> TEMP_USE_DS18B20 true  — temp from DallasTemperature library (°C)
//   NTC analog      -> TEMP_USE_DS18B20 false — temp from ADC + Steinhart (see main.cpp)
//
// KY-001 DS18B20 wiring per:
// https://arduinomodules.info/ky-001-temperature-sensor-module/
//
//   S      -> TEMP_ONEWIRE_PIN (your signal pin)
//   middle -> 3.3V on ESP32 (page shows +5V on Arduino; DS18B20 works 3.0–5.5 V)
//   (-)    -> GND
//
// GPIO 36 is the light sensor — do not use it for temperature.
constexpr bool TEMP_USE_DS18B20 = true;
constexpr int TEMP_ONEWIRE_PIN = 32;
static_assert(TEMP_ONEWIRE_PIN != LDR_PIN, "DS18B20 data pin must not be the LDR pin");

// --- Analog KY-001 (NTC thermistor board) — only if TEMP_USE_DS18B20 is false ---
constexpr int TEMP_ANALOG_PIN = 32;
constexpr bool TEMP_BARE_NTC_INTERNAL_PULLUP = false;
constexpr float TEMP_SERIES_OHM =
    TEMP_BARE_NTC_INTERNAL_PULLUP ? 47000.0f : 10000.0f;
constexpr bool TEMP_THERMISTOR_HIGH_SIDE = true;
constexpr float TEMP_NOMINAL_OHM = 10000.0f;
constexpr float TEMP_BETA = 3950.0f;
constexpr float TEMP_OFFSET_C = 0.0f;
constexpr float TEMP_SMOOTHING_ALPHA = 0.2f;

// 3-pin speaker / buzzer module (e.g. HW-508, KY-012 style):
//   S  / I/O / IN  -> GPIO 25 (SPEAKER_PIN)  — signal only
//   +  / VCC / V    -> 3.3V (or 5V if your module requires it)
//   -  / GND / G    -> GND
// Do NOT wire VCC to a GPIO pin.
constexpr int SPEAKER_PIN = 25;
constexpr int SPEAKER_LEDC_CHANNEL = 0;

constexpr bool SPEAKER_ACTIVE_BUZZER = false;

constexpr uint16_t MELODY_TEMPO_NUMERATOR_MS = 1000;
constexpr uint16_t MELODY_PAUSE_PERCENT = 130;

constexpr uint32_t SENSOR_READ_INTERVAL_MS = 500;
constexpr uint32_t TEMP_READ_INTERVAL_MS = 250;
constexpr uint32_t MQTT_PUBLISH_INTERVAL_MS = 500;
constexpr uint32_t MQTT_RECONNECT_INTERVAL_MS = 5000;
constexpr uint32_t LED_ON_DURATION_MS = 5000;
constexpr uint32_t LED_OFF_DURATION_MS = 2000;
