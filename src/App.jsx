import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import StatusSummary from "./components/StatusSummary";
import SearchFilter from "./components/SearchFilter";
import FilterTabs from "./components/FilterTabs";
import DeviceCard from "./components/DeviceCard";
import AddDeviceCard from "./components/AddDeviceCard";
import DeviceDetail from "./components/DeviceDetail";
import AddDeviceForm from "./components/AddDeviceForm";
import SettingsModal from "./components/SettingsModal";
import { devices as initialDevices, createDevice } from "./data/mockData";
import { useMqttSensors } from "./lib/mqtt";
import { SOUND_TOPIC } from "./config";
import { ledColorFromLight } from "./utils/lightStatus";
import "./App.css";

const SOUND_STORAGE_KEY = "dashboard.soundEnabled";

export default function App() {
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("monstera");
  const [view, setView] = useState("list");
  const [openId, setOpenId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const { status: brokerStatus, publish } = useMqttSensors(setDevices);

  const handleSoundChange = (next) => {
    setSoundEnabled(next);
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    // No direct publish — the effect below sends the combined
    // { sound, led_color } payload whenever either input changes.
  };

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  // Tick once every 30 s so the "Last read N min ago" labels refresh while idle.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Decorate each device with a derived `lastReadAgoMin`. Seed devices keep
  // their static value; live devices use the timestamp from MQTT.
  const liveDevices = useMemo(
    () =>
      devices.map((d) =>
        d.lastSeenAt
          ? { ...d, lastReadAgoMin: Math.max(0, Math.floor((now - d.lastSeenAt) / 60_000)) }
          : d,
      ),
    [devices, now],
  );

  const counts = useMemo(
    () => ({
      online:  liveDevices.filter((d) => d.status === "online").length,
      warning: liveDevices.filter((d) => d.status === "warning").length,
      offline: liveDevices.filter((d) => d.status === "offline").length,
    }),
    [liveDevices],
  );

  // Single-card mode: derive the LED color from the primary device's light.
  // Same string identity across renders when the band doesn't change, so the
  // effect below only re-fires when the LED color actually transitions
  // blue ↔ green ↔ red.
  const ledColor = ledColorFromLight(liveDevices[0]?.current?.lightPct);

  // Combined publish to SOUND_TOPIC. Sends `sound` always (user-controlled
  // toggle) and `led_color` once we have a reading. Retained so the ESP32
  // gets the latest state on (re)connect. Fires on mount (initial sync) and
  // whenever sound or LED color changes.
  useEffect(() => {
    const payload = { sound: soundEnabled };
    if (ledColor) payload.led_color = ledColor;
    publish(SOUND_TOPIC, payload, { qos: 0, retain: true });
  }, [soundEnabled, ledColor, publish]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return liveDevices
      .filter((d) => filter === "all" || d.status === filter)
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q),
      );
  }, [liveDevices, search, filter]);

  const settingsModal = (
    <SettingsModal
      open={settingsOpen}
      soundEnabled={soundEnabled}
      onSoundChange={handleSoundChange}
      onClose={closeSettings}
    />
  );

  if (view === "add") {
    return (
      <>
        <AddDeviceForm
          brokerStatus={brokerStatus}
          onOpenSettings={openSettings}
          onSubmit={(input) => {
            const newDevice = createDevice(input);
            setDevices((prev) => [...prev, newDevice]);
            setSelectedId(newDevice.id);
            setView("list");
          }}
          onCancel={() => setView("list")}
        />
        {settingsModal}
      </>
    );
  }

  if (view === "detail") {
    const openDevice = liveDevices.find((d) => d.id === openId);
    if (openDevice) {
      return (
        <>
          <DeviceDetail
            device={openDevice}
            brokerStatus={brokerStatus}
            onOpenSettings={openSettings}
            onBack={() => setView("list")}
            onDelete={() => {
              const ok = window.confirm(
                `Delete "${openDevice.name}"? This can't be undone.`,
              );
              if (!ok) return;
              setDevices((prev) => prev.filter((d) => d.id !== openDevice.id));
              if (selectedId === openDevice.id) {
                const fallback = devices.find((d) => d.id !== openDevice.id);
                setSelectedId(fallback ? fallback.id : null);
              }
              setOpenId(null);
              setView("list");
            }}
          />
          {settingsModal}
        </>
      );
    }
  }

  const handleOpen = (id) => {
    setSelectedId(id);
    setOpenId(id);
    setView("detail");
  };

  return (
    <>
      <div className="page">
        <div className="dashboard">
          <Header brokerStatus={brokerStatus} onOpenSettings={openSettings} />
          <StatusSummary counts={counts} total={liveDevices.length} />
          <SearchFilter value={search} onChange={setSearch} />
          <FilterTabs value={filter} onChange={setFilter} />
          <h3 className="section-title">My devices</h3>
          <div className="device-grid">
            {filtered.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                selected={d.id === selectedId}
                onClick={() => handleOpen(d.id)}
              />
            ))}
            <AddDeviceCard onClick={() => setView("add")} />
          </div>
        </div>
      </div>
      {settingsModal}
    </>
  );
}
