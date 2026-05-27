// All MQTT config is sourced from Vite env vars (VITE_* in `.env.local`),
// with sensible LAN-default fallbacks so the dashboard still boots without an
// env file. See `.env.example` for the full list.
//
// WARNING: VITE_* env vars are embedded in the client bundle — they are NOT
// secret. Acceptable for a LAN-only hackathon broker; do not reuse for prod.

const env = import.meta.env;

export const BROKER_URL = env.VITE_MQTT_BROKER_URL || "ws://10.6.10.36:9001";
export const TOPIC_PATTERN = env.VITE_MQTT_TOPIC_PATTERN || "hackathon/sensors/+";

// undefined (not empty string) so mqtt.js omits the auth packet entirely when
// no credentials are configured.
export const MQTT_USERNAME = env.VITE_MQTT_USERNAME || undefined;
export const MQTT_PASSWORD = env.VITE_MQTT_PASSWORD || undefined;
