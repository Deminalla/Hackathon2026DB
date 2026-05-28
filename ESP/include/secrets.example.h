#pragma once

#define USE_WPA2_ENTERPRISE 0

#define WIFI_SSID "your-ssid"
#define WIFI_PASS "your-password"

#define EAP_IDENTITY "user@example.com"
#define EAP_USERNAME "user@example.com"
#define EAP_PASSWORD "your-eap-password"

// --- MQTT broker ---
// Local Mosquitto: MQTT_USE_TLS 0, port 1883, MQTT_USERNAME "" and MQTT_PASSWORD "".
// HiveMQ Cloud: MQTT_USE_TLS 1, port 8883, cluster hostname, credentials.
#define MQTT_USE_TLS 1
#define MQTT_HOST "104ebbfbd174457e81fe0e3880e2d779.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "darkside"
#define MQTT_PASSWORD "your-hivemq-password"
#define MQTT_CLIENT_ID "ESP32Client-1000"

#define MQTT_TOPIC_PUBLISH "darkside"
#define MQTT_TOPIC_SUBSCRIBE "sigita_liepe/the_force"

#define OTA_HOSTNAME "esp32-dev"
#define OTA_PASSWORD "esp32-ota"
