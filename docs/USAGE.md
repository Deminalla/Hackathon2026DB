# Using the dashboard

The React app subscribes to sensor data and publishes control commands over MQTT.

## Connection status

The header shows **MQTT connected** or **disconnected**.  
If disconnected, fix broker URL and credentials — [MQTT.md](MQTT.md).

## Device card

Shows live values from topic `darkside` (configurable via `VITE_MQTT_TOPIC_PATTERN`):

| Field | Meaning |
|-------|---------|
| **Light** | `light_pct` — brightness percentage |
| **Temperature** | `temp` — °C (two decimal places) |

Click the card for detail view and history chart.

## Live chart

- **Time axis** uses real timestamps (not a flat line).  
- **Temperature axis** scales to the current min/max so small changes are visible.  
- **Light** and **temperature** history build while you stay on the page.

## Settings (gear icon)

Opens the settings modal. Changes are sent to MQTT topic `sigita_liepe/the_force` with **retain** so the ESP gets the last state when it connects.

| Control | MQTT field | ESP behavior |
|---------|------------|--------------|
| **Sound** | `sound: true/false` | Mario melody when on |
| **I lost my plant** | `lost_my_device: true` | Plays Doom alarm even if sound is off |

Optional JSON field `led_color` (if sent by firmware/UI) can drive the RGB LED.

## On-device web UI

The ESP also hosts a small web page at its IP address (serial log prints the IP after Wi-Fi connect). Useful when the laptop dashboard is unavailable.

## Production URL

After Vercel deploy, share the `https://….vercel.app` link.  
Everyone on the internet uses the same HiveMQ broker — only one ESP should publish to `darkside` unless you change topics per device.

## Troubleshooting UI

| Issue | Fix |
|-------|-----|
| Flat temperature chart | Ensure firmware is publishing; refresh after ESP boot |
| Values stuck | MQTT disconnected or wrong topic pattern |
| Sound doesn't work | ESP must subscribe to `sigita_liepe/the_force`; check serial log |
| Lost plant silent | Confirm `lost_my_device: true` in retained message on that topic |
