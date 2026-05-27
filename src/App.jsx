import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import StatusSummary from "./components/StatusSummary";
import SearchFilter from "./components/SearchFilter";
import FilterTabs from "./components/FilterTabs";
import DeviceCard from "./components/DeviceCard";
import AddDeviceCard from "./components/AddDeviceCard";
import DeviceDetail from "./components/DeviceDetail";
import AddDeviceForm from "./components/AddDeviceForm";
import { devices as initialDevices, createDevice } from "./data/mockData";
import { useMqttSensors } from "./lib/mqtt";
import "./App.css";

export default function App() {
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("monstera");
  const [view, setView] = useState("list");
  const [openId, setOpenId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const brokerStatus = useMqttSensors(setDevices);

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

  if (view === "add") {
    return (
      <AddDeviceForm
        brokerStatus={brokerStatus}
        onSubmit={(input) => {
          const newDevice = createDevice(input);
          setDevices((prev) => [...prev, newDevice]);
          setSelectedId(newDevice.id);
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "detail") {
    const openDevice = liveDevices.find((d) => d.id === openId);
    if (openDevice) {
      return (
        <DeviceDetail
          device={openDevice}
          brokerStatus={brokerStatus}
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
      );
    }
  }

  const handleOpen = (id) => {
    setSelectedId(id);
    setOpenId(id);
    setView("detail");
  };

  return (
    <div className="page">
      <div className="dashboard">
        <Header brokerStatus={brokerStatus} />
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
  );
}
