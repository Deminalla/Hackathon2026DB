// All MQTT config is sourced from Vite env vars (VITE_* in `.env.local`),
// with sensible LAN-default fallbacks so the dashboard still boots without an
// env file. See `.env.example` for the full list.
//
// WARNING: VITE_* env vars are embedded in the client bundle — they are NOT
// secret. Acceptable for a LAN-only hackathon broker; do not reuse for prod.

const env = import.meta.env;

export const BROKER_URL = env.VITE_MQTT_BROKER_URL || "ws://localhost:9001";
// Subscribe topic — must match ESP MQTT_TOPIC_PUBLISH (default: darkside).
export const TOPIC_PATTERN = env.VITE_MQTT_TOPIC_PATTERN || "darkside";

// undefined (not empty string) so mqtt.js omits the auth packet entirely when
// no credentials are configured.
const trim = (v) => (typeof v === "string" ? v.trim() : "");
export const MQTT_USERNAME = trim(env.VITE_MQTT_USERNAME) || undefined;
export const MQTT_PASSWORD = trim(env.VITE_MQTT_PASSWORD) || undefined;

// Outbound control topic for the global "alert sound" toggle in the settings
// modal. Published with retain:true so any ESP32 connecting later immediately
// receives the current desired state. Override via VITE_MQTT_SOUND_TOPIC.
export const SOUND_TOPIC = env.VITE_MQTT_SOUND_TOPIC || "sigita_liepe/the_force";
