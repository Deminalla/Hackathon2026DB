#include <Arduino.h>
#include <driver/adc.h>
#include <math.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <WiFi.h>
#include <esp_wifi.h>

#include "config.h"
#include "secrets.h"
#include "speaker.h"

#if MQTT_USE_TLS
#include <WiFiClientSecure.h>
#endif

#if USE_WPA2_ENTERPRISE
#include "esp_wpa2.h"
#endif

#if TEMP_USE_DS18B20
#include <DallasTemperature.h>
#include <OneWire.h>
OneWire oneWire(TEMP_ONEWIRE_PIN);
DallasTemperature tempSensor(&oneWire);
#endif

constexpr float kTempReadError = -127.0f;

WebServer server(80);
#if MQTT_USE_TLS
WiFiClientSecure wifiClient;
#else
WiFiClient wifiClient;
#endif
PubSubClient mqttClient(wifiClient);

float temperature = NAN;
bool temperatureValid = false;
int tempRawAdc = 0;
int lastLoggedTempRaw = -1;
int tempRawMin = 4095;
int tempRawMax = 0;
unsigned long tempStuckSinceMs = 0;
int lightValue = 0;

unsigned long lastMsg = 0;
unsigned long lastSensorRead = 0;
unsigned long lastTempRead = 0;
unsigned long lastLedToggle = 0;
unsigned long lastReconnectAttempt = 0;
bool ledOn = false;

bool mqttSound = false;
bool mqttLostPlant = false;
String mqttLedColor = "";
String logs = "";

void appendLog(const String& message) {
  logs += message + "\n";
  if (logs.length() > 4000) {
    logs = logs.substring(logs.length() - 4000);
  }
}

void reconnect();
void handleMqttMessage(char* topic, byte* payload, unsigned int length);

void applyForceMqttPayload(JsonObject doc) {
  bool audioChanged = false;

  if (doc.containsKey("sound")) {
    mqttSound = doc["sound"].as<bool>();
    audioChanged = true;
  }
  if (doc.containsKey("lost_my_device")) {
    mqttLostPlant = doc["lost_my_device"].as<bool>();
    audioChanged = true;
  }
  if (doc.containsKey("led_color")) {
    mqttLedColor = doc["led_color"].as<String>();
  }

  if (audioChanged) {
    speakerApplyMqttControl(mqttSound, mqttLostPlant);
    appendLog(String("Audio (MQTT): sound=") + (mqttSound ? "ON" : "OFF") + " lost=" +
              (mqttLostPlant ? "ON" : "OFF") + " play=" + (speakerShouldPlay() ? "yes" : "no"));
  }
}

// DS18B20 valid range per datasheet; also reject known error sentinels.
bool isValidDs18b20C(const float tempC) {
  if (tempC <= -126.0f) {
    return false;
  }
  // Power-on / not-yet-converted scratchpad default (Maxim datasheet), not real temp.
  if (tempC > 84.0f && tempC < 86.0f) {
    return false;
  }
  return tempC >= -55.0f && tempC <= 125.0f;
}

// NTC + Steinhart (only when TEMP_USE_DS18B20 is false).
bool isValidThermistorC(const float tempC) {
  return tempC > -55.0f && tempC < 125.0f && tempC != kTempReadError;
}

int readAdcRaw(const int gpio) {
  const int channel = digitalPinToAnalogChannel(gpio);
  if (channel < 0) {
    return -1;
  }
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(static_cast<adc1_channel_t>(channel), ADC_ATTEN_DB_11);
  // Discard first sample after mux switch (ESP32 ADC crosstalk).
  (void)adc1_get_raw(static_cast<adc1_channel_t>(channel));
  delayMicroseconds(200);
  return adc1_get_raw(static_cast<adc1_channel_t>(channel));
}

// Steinhart–Hart (beta form) for KY-001 NTC module: 10k @ 25°C, beta 3950, 10k divider.
float rawToThermistorC(const int raw) {
  if (raw <= 8 || raw >= 4087) {
    return kTempReadError;
  }

  float resistance;
#if TEMP_THERMISTOR_HIGH_SIDE
  // NTC between VCC and signal, fixed resistor to GND (raw rises when bead heats).
  resistance = TEMP_SERIES_OHM * (4095.0f / static_cast<float>(raw) - 1.0f);
#else
  // NTC between signal and GND, fixed resistor to VCC (raw falls when bead heats).
  resistance =
      TEMP_SERIES_OHM * static_cast<float>(raw) / (4095.0f - static_cast<float>(raw));
#endif

  const float steinhart = logf(resistance / TEMP_NOMINAL_OHM) / TEMP_BETA +
                          1.0f / (25.0f + 273.15f);
  return (1.0f / steinhart) - 273.15f + TEMP_OFFSET_C;
}

// KY-001 (Keyes): 10k NTC to GND, 10k to VCC — warming lowers ADC raw.
float readAnalogThermistorC(int* outRaw) {
  constexpr int samples = 4;
  uint32_t sum = 0;
  for (int i = 0; i < samples; i++) {
    const int sample = readAdcRaw(TEMP_ANALOG_PIN);
    if (sample < 0) {
      return kTempReadError;
    }
    sum += sample;
  }
  const int raw = static_cast<int>(sum / samples);
  if (outRaw != nullptr) {
    *outRaw = raw;
  }
  return rawToThermistorC(raw);
}

bool isPinUsedByProject(const int pin) {
  return pin == LDR_PIN || pin == RGB_RED || pin == RGB_GREEN || pin == RGB_BLUE ||
         pin == SPEAKER_PIN || pin == LED_PIN_23
#if TEMP_USE_DS18B20
         || pin == TEMP_ONEWIRE_PIN
#else
         || pin == TEMP_ANALOG_PIN
#endif
         ;
}

void logKy001PinDiagnostic() {
  static const int kAdcPins[] = {32, 33, 34, 35, 36, 39};
  int minVal[6];
  int maxVal[6];
  for (size_t i = 0; i < 6; i++) {
    minVal[i] = 4095;
    maxVal[i] = 0;
  }

  Serial.println();
  Serial.println("=== KY-001 PIN SCAN (hold the METAL bead on the module 15s) ===");
  for (int n = 0; n < 12; n++) {
    for (size_t i = 0; i < 6; i++) {
      const int pin = kAdcPins[i];
      const int raw = readAdcRaw(pin);
      if (raw < 0) {
        Serial.printf("  GPIO %2d: (not ADC)\n", pin);
        continue;
      }
      minVal[i] = min(minVal[i], raw);
      maxVal[i] = max(maxVal[i], raw);
      Serial.printf("  GPIO %2d raw=%4d -> %.1f C\n", pin, raw, rawToThermistorC(raw));
    }
    Serial.println("  ---");
    delay(500);
  }

  int bestPin = -1;
  int bestRange = 0;
  for (size_t i = 0; i < 6; i++) {
    const int pin = kAdcPins[i];
    const int range = maxVal[i] - minVal[i];
    Serial.printf("GPIO %d range=%d (min=%d max=%d)", pin, range, minVal[i], maxVal[i]);
    if (pin == LDR_PIN) {
      Serial.print("  <- light sensor (KY-018), NOT temperature");
    } else if (isPinUsedByProject(pin)) {
      Serial.print("  <- already used by project");
    }
    Serial.println();

    if (isPinUsedByProject(pin)) {
      continue;
    }
    if (range > bestRange) {
      bestRange = range;
      bestPin = pin;
    }
  }

  int tempPinRange = 0;
  for (size_t i = 0; i < 6; i++) {
    if (kAdcPins[i] == TEMP_ANALOG_PIN) {
      tempPinRange = maxVal[i] - minVal[i];
      break;
    }
  }

  if (tempPinRange < 30) {
    Serial.println();
    Serial.println("FAIL: KY-001 on configured pin barely moves. Check S/+/- wiring.");
    Serial.println("  NOTE: GPIO 36 is the light sensor (KY-018), not temperature.");
  } else {
    Serial.printf("OK: GPIO %d responds (range %d). Keep S wire on this pin.\n", TEMP_ANALOG_PIN,
                  tempPinRange);
    Serial.println("     Heat bead -> raw should change; ignore floating pins 33-35/39.");
    Serial.println("     Ignore GPIO 36 (LDR).");
  }

  if (bestPin >= 0 && bestPin != TEMP_ANALOG_PIN && !isPinUsedByProject(bestPin) &&
      tempPinRange < 80) {
    Serial.printf(
        "Note: GPIO %d had noise (range %d) — do not move temp wire unless GPIO %d is dead.\n",
        bestPin, bestRange, TEMP_ANALOG_PIN);
  }
  Serial.println("=== end scan ===\n");
}

void setupTemperatureSensor() {
#if TEMP_USE_DS18B20
  // Same flow as https://arduinomodules.info/ky-001-temperature-sensor-module/
  tempSensor.begin();
  tempSensor.setResolution(12);
  tempSensor.setPullup(true);

  const int deviceCount = tempSensor.getDeviceCount();
  Serial.printf("KY-001 DS18B20: S -> GPIO %d, middle -> 3.3V, (-) -> GND\n", TEMP_ONEWIRE_PIN);
  Serial.printf("OneWire devices found: %d (expect 1)\n", deviceCount);

  if (deviceCount == 0) {
    Serial.println("ERROR: No DS18B20 on GPIO 32.");
    Serial.println("  If your board is the analog NTC KY-001, set TEMP_USE_DS18B20 = false in config.h");
    temperatureValid = false;
  } else {
    Serial.println("Requesting first temperature...");
    tempSensor.requestTemperatures();
    delay(750);
    const float first = tempSensor.getTempCByIndex(0);
    tempSensor.requestTemperatures();

    if (!isValidDs18b20C(first)) {
      Serial.printf("DS18B20 read invalid (%.2f C) — check wiring\n", first);
      temperatureValid = false;
    } else {
      temperature = first;
      temperatureValid = true;
      Serial.printf("DS18B20 ready: %.2f C (12-bit, 0.0625 C steps)\n", temperature);
    }
  }
#else
#if TEMP_BARE_NTC_INTERNAL_PULLUP
  pinMode(TEMP_ANALOG_PIN, INPUT_PULLUP);
  Serial.printf("Temp: bare NTC on GPIO %d + internal pull-up (~47k)\n", TEMP_ANALOG_PIN);
#else
  pinMode(TEMP_ANALOG_PIN, INPUT);
  Serial.printf("Temp: KY-001 module on GPIO %d (10k resistor is on the module — no extra parts)\n",
                TEMP_ANALOG_PIN);
#endif
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(TEMP_ANALOG_PIN, ADC_11db);

  logKy001PinDiagnostic();

  int raw = 0;
  const float first = readAnalogThermistorC(&raw);
  tempRawAdc = raw;
  if (isValidThermistorC(first)) {
    temperature = first;
    temperatureValid = true;
    Serial.printf("KY-001 NTC on GPIO %d: %.2f C (ADC raw %d)\n", TEMP_ANALOG_PIN, temperature,
                  raw);
  } else {
    Serial.printf("KY-001 read failed (S -> GPIO %d, + -> 3.3V, - -> GND)\n", TEMP_ANALOG_PIN);
  }
#endif
}

void updateTemperatureReading() {
#if TEMP_USE_DS18B20
  // Async read: wait for prior requestTemperatures() to finish, then start the next.
  if (!tempSensor.isConversionComplete()) {
    return;
  }

  const float tempC = tempSensor.getTempCByIndex(0);
  tempSensor.requestTemperatures();

  if (!isValidDs18b20C(tempC)) {
    temperatureValid = false;
    return;
  }

  temperature = tempC;
  temperatureValid = true;
  tempRawAdc = static_cast<int>(tempC * 100.0f);

  static float lastLogged = NAN;
  if (isnan(lastLogged) || fabsf(tempC - lastLogged) >= 0.0625f) {
    lastLogged = tempC;
    Serial.printf("[temp] DS18B20 GPIO %d: %.2f C\n", TEMP_ONEWIRE_PIN, tempC);
  }
#else
  int raw = 0;
  const float tempC = readAnalogThermistorC(&raw);
  tempRawAdc = raw;
  if (isValidThermistorC(tempC)) {
    if (isnan(temperature) || TEMP_SMOOTHING_ALPHA <= 0.0f) {
      temperature = tempC;
    } else {
      temperature = temperature * (1.0f - TEMP_SMOOTHING_ALPHA) + tempC * TEMP_SMOOTHING_ALPHA;
    }
    temperatureValid = true;

    if (lastLoggedTempRaw < 0 || abs(tempRawAdc - lastLoggedTempRaw) >= 4) {
      lastLoggedTempRaw = tempRawAdc;
      Serial.printf("[temp] GPIO %d raw=%d -> %.2f C\n", TEMP_ANALOG_PIN, tempRawAdc, temperature);
    }
  }
#endif
}

bool mqttConnect() {
#if defined(MQTT_USERNAME) && defined(MQTT_PASSWORD)
  if (MQTT_USERNAME[0] != '\0') {
    return mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
  }
#endif
  return mqttClient.connect(MQTT_CLIENT_ID);
}

void setRGB(int red, int green, int blue) {
  ledcWrite(1, red);
  ledcWrite(2, green);
  ledcWrite(3, blue);
}

void setupWiFi() {
  Serial.begin(115200);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

#if USE_WPA2_ENTERPRISE
  esp_wifi_sta_wpa2_ent_set_identity(reinterpret_cast<uint8_t*>(const_cast<char*>(EAP_IDENTITY)),
                                     strlen(EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_username(reinterpret_cast<uint8_t*>(const_cast<char*>(EAP_USERNAME)),
                                     strlen(EAP_USERNAME));
  esp_wifi_sta_wpa2_ent_set_password(reinterpret_cast<uint8_t*>(const_cast<char*>(EAP_PASSWORD)),
                                     strlen(EAP_PASSWORD));
  esp_wifi_sta_wpa2_ent_enable();
  WiFi.begin(WIFI_SSID);
#else
  WiFi.begin(WIFI_SSID, WIFI_PASS);
#endif

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  esp_wifi_set_ps(WIFI_PS_NONE);
}

void setupOTA() {
  ArduinoOTA.setPort(3232);
  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);

  ArduinoOTA.onStart([]() {
    const String type = ArduinoOTA.getCommand() == U_FLASH ? "sketch" : "filesystem";
    Serial.println("Start updating " + type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });

  ArduinoOTA.begin();
}

void setupWebServer() {
  server.on("/", []() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
    html += "<title>ESP32 Dashboard</title>";
    html += "<style>body{font-family:sans-serif;margin:20px;background:#1a1a2e;color:#eee}";
    html += ".card{background:#16213e;border-radius:10px;padding:20px;margin:10px 0;box-shadow:0 2px 8px rgba(0,0,0,.3)}";
    html += ".value{font-size:2.5em;font-weight:bold;color:#0f3460}";
    html += ".label{font-size:0.9em;color:#aaa;margin-bottom:5px}";
    html += "pre{background:#0f3460;padding:15px;border-radius:8px;overflow-x:auto;font-size:0.85em;max-height:300px;overflow-y:auto}";
    html += "h1{color:#e94560}</style></head><body>";
    html += "<h1>ESP32 Sensor Dashboard</h1>";
    html += "<div class='card'><div class='label'>Light Level (KY-018)</div>";
    html += "<div class='value' id='light'>--</div>";
    html += "<div class='label' id='lightpct'>--%</div></div>";
    html += "<div class='card'><div class='label'>Temperature (KY-001 DS18B20)</div>";
    html += "<div class='value' id='temp'>--</div>";
    html += "<div class='label' id='tempstatus'></div>";
    html += "<div class='label' id='tempraw'></div></div>";
    html += "<div class='card'><div class='label'>Sound (MQTT UI)</div>";
    html += "<div class='value' id='sound'>--</div></div>";
    html += "<div class='card'><div class='label'>I lost my plant</div>";
    html += "<div class='value' id='lostplant'>--</div></div>";
    html += "<div class='card'><div class='label'>Track (when playing)</div>";
    html += "<div class='value' id='song'>--</div></div>";
    html += "<div class='card'><div class='label'>LED Color (MQTT UI)</div>";
    html += "<div class='value' id='ledcolor'>--</div></div>";
    html += "<div class='card'><div class='label'>Logs</div><pre id='logs'></pre></div>";
    html += "<script>";
    html += "function update(){fetch('/data').then(r=>r.json()).then(d=>{";
    html += "document.getElementById('light').textContent=d.light+' / 4095';";
    html += "document.getElementById('lightpct').textContent=d.pct+'% brightness';";
    html += "document.getElementById('temp').textContent=d.temp_valid?d.temp+'\\u00B0C':'--';";
    html += "document.getElementById('tempstatus').textContent=d.temp_valid?'':'sensor offline';";
    html += "document.getElementById('tempraw').textContent=d.temp_valid?('x100='+d.temp_raw):'';";
    html += "document.getElementById('sound').textContent=d.playing?'ON':'OFF';";
    html += "document.getElementById('sound').style.color=d.sound?'#4caf50':'#e94560';";
    html += "document.getElementById('lostplant').textContent=d.lost_plant?'ALARM':'off';";
    html += "document.getElementById('lostplant').style.color=d.lost_plant?'#e94560':'#4caf50';";
    html += "document.getElementById('song').textContent=d.playing?d.song:'—';";
    html += "document.getElementById('ledcolor').textContent=d.led_color||'auto';";
    html += "document.getElementById('logs').textContent=d.logs;";
    html += "}).catch(()=>{})}";
    html += "setInterval(update,500);update();";
    html += "</script></body></html>";
    server.send(200, "text/html", html);
  });

  server.on("/data", []() {
    const int lightPct = map(lightValue, 0, 4095, 100, 0);
    String escapedLogs = logs;
    escapedLogs.replace("\\", "\\\\");
    escapedLogs.replace("\"", "\\\"");
    escapedLogs.replace("\n", "\\n");

    const bool playing = speakerShouldPlay();
    String json = "{\"light\":" + String(lightValue);
    json += ",\"pct\":" + String(lightPct);
    json += ",\"temp\":" + String(temperatureValid ? temperature : 0.0f, 1);
    json += ",\"temp_valid\":" + String(temperatureValid ? "true" : "false");
    json += ",\"temp_raw\":" + String(tempRawAdc);
    json += ",\"playing\":" + String(playing ? "true" : "false");
    json += ",\"sound\":" + String(mqttSound ? "true" : "false");
    json += ",\"lost_plant\":" + String(mqttLostPlant ? "true" : "false");
    json += ",\"song\":\"" + String(playing ? speakerGetSongName() : "") + "\"";
    json += ",\"led_color\":\"" + mqttLedColor + "\"";
    json += ",\"logs\":\"" + escapedLogs + "\"}";
    server.send(200, "application/json", json);
  });

  server.begin();
}

void setupSensors() {
  pinMode(LED_PIN_23, OUTPUT);

  analogSetAttenuation(ADC_11db);
  analogReadResolution(12);

  setupTemperatureSensor();

  ledcSetup(1, 5000, 8);
  ledcSetup(2, 5000, 8);
  ledcSetup(3, 5000, 8);
  ledcAttachPin(RGB_RED, 2);
  ledcAttachPin(RGB_GREEN, 1);
  ledcAttachPin(RGB_BLUE, 3);
  setRGB(0, 0, 0);
}

void updateRgbLed() {
  const int lightPctLed = map(lightValue, 0, 4095, 100, 0);

  if (mqttLedColor.length() > 0) {
    if (mqttLedColor == "red") {
      setRGB(RGB_MAX, 0, 0);
    } else if (mqttLedColor == "green") {
      setRGB(0, RGB_MAX, 0);
    } else if (mqttLedColor == "blue") {
      setRGB(0, 0, RGB_MAX);
    } else if (mqttLedColor == "yellow") {
      setRGB(RGB_MAX, RGB_MAX, 0);
    } else if (mqttLedColor == "purple") {
      setRGB(RGB_MAX, 0, RGB_MAX);
    } else if (mqttLedColor == "cyan") {
      setRGB(0, RGB_MAX, RGB_MAX);
    } else if (mqttLedColor == "off") {
      setRGB(0, 0, 0);
    } else {
      setRGB(RGB_MAX, RGB_MAX, RGB_MAX);
    }
    return;
  }

  if (lightPctLed <= 33) {
    setRGB(0, 0, RGB_MAX);
  } else if (lightPctLed <= 66) {
    setRGB(0, RGB_MAX, 0);
  } else {
    setRGB(RGB_MAX, 0, 0);
  }
}

void updateStatusLed(unsigned long now) {
  if (ledOn && (now - lastLedToggle >= LED_ON_DURATION_MS)) {
    digitalWrite(LED_PIN_23, LOW);
    ledOn = false;
    lastLedToggle = now;
  } else if (!ledOn && (now - lastLedToggle >= LED_OFF_DURATION_MS)) {
    digitalWrite(LED_PIN_23, HIGH);
    ledOn = true;
    lastLedToggle = now;
  }
}

void publishSensorData(unsigned long now) {
  if (!temperatureValid) {
    return;
  }

  if (now - lastMsg < MQTT_PUBLISH_INTERVAL_MS) {
    return;
  }
  lastMsg = now;

  const int lightPctMqtt = map(lightValue, 0, 4095, 100, 0);
  char message[96];
  snprintf(message, sizeof(message),
             "{\"light_pct\":%d,\"temp\":%.2f,\"temp_raw\":%d}",
             lightPctMqtt, static_cast<double>(temperature), tempRawAdc);
  const String messageStr = message;

  Serial.print("Publishing to ");
  Serial.print(MQTT_TOPIC_PUBLISH);
  Serial.print(": ");
  Serial.println(messageStr);
  appendLog(messageStr);

  if (mqttClient.connected()) {
    mqttClient.publish(MQTT_TOPIC_PUBLISH, messageStr.c_str());
  }
}

void setup() {
  setupWiFi();
  setupOTA();
  setupWebServer();

#if MQTT_USE_TLS
  wifiClient.setInsecure();
#endif
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(handleMqttMessage);
  mqttClient.setBufferSize(512);

  setupSensors();
  speakerSetup();
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();

  const unsigned long now = millis();

  if (now - lastTempRead >= TEMP_READ_INTERVAL_MS) {
    lastTempRead = now;
    updateTemperatureReading();

    tempRawMin = min(tempRawMin, tempRawAdc);
    tempRawMax = max(tempRawMax, tempRawAdc);
    if (tempRawMax - tempRawMin < 20) {
      if (tempStuckSinceMs == 0) {
        tempStuckSinceMs = now;
      } else if (now - tempStuckSinceMs > 15000) {
        static unsigned long lastStuckLog = 0;
        if (now - lastStuckLog > 15000) {
          lastStuckLog = now;
          Serial.printf(
              "WARN: GPIO %d raw stuck %d-%d — heat the metal bead; if no change, re-run boot scan or replace module\n",
              TEMP_ANALOG_PIN, tempRawMin, tempRawMax);
        }
      }
    } else {
      tempStuckSinceMs = 0;
      tempRawMin = tempRawAdc;
      tempRawMax = tempRawAdc;
    }
  }

  if (now - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
    lastSensorRead = now;
    lightValue = readAdcRaw(LDR_PIN);
    const int lightPct = map(lightValue, 0, 4095, 100, 0);
    if (temperatureValid) {
      Serial.printf("Light: %d (%d%%) | Temp: %.2f C (DS18B20 GPIO %d)\n", lightValue, lightPct,
                    temperature, TEMP_ONEWIRE_PIN);
      appendLog("Light: " + String(lightValue) + " (" + String(lightPct) + "%) | Temp: " +
                String(temperature, 2) + "C");
    } else {
      Serial.printf("Light: %d (%d%%) | Temp: offline | raw %d\n", lightValue, lightPct,
                    tempRawAdc);
    }
  }

  if (!mqttClient.connected()) {
    if (now - lastReconnectAttempt >= MQTT_RECONNECT_INTERVAL_MS) {
      lastReconnectAttempt = now;
      reconnect();
    }
  } else {
    mqttClient.loop();
  }

  publishSensorData(now);
  updateStatusLed(now);
  updateRgbLed();
  speakerUpdate();
}

void handleMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  String msg;
  for (unsigned int i = 0; i < length; i++) {
    Serial.print(static_cast<char>(payload[i]));
    msg += static_cast<char>(payload[i]);
  }
  Serial.println();

  if (String(topic) != MQTT_TOPIC_SUBSCRIBE) {
    return;
  }

  StaticJsonDocument<256> doc;
  const DeserializationError err = deserializeJson(doc, msg);
  if (err) {
    appendLog("Force JSON parse error: " + String(err.c_str()));
    return;
  }

  applyForceMqttPayload(doc.as<JsonObject>());
}

void reconnect() {
  Serial.print("Attempting MQTT connection...");

  if (mqttConnect()) {
    Serial.println("connected");
    mqttClient.subscribe(MQTT_TOPIC_SUBSCRIBE);
    Serial.print("Subscribed to: ");
    Serial.println(MQTT_TOPIC_SUBSCRIBE);
    return;
  }

  Serial.print("failed, rc=");
  Serial.print(mqttClient.state());
  Serial.println(" will retry...");
}
