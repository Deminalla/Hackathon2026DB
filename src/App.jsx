import { useMemo, useState } from "react";
import Header from "./components/Header";
import StatusSummary from "./components/StatusSummary";
import SearchFilter from "./components/SearchFilter";
import FilterTabs from "./components/FilterTabs";
import DeviceCard from "./components/DeviceCard";
import AddDeviceCard from "./components/AddDeviceCard";
import DeviceDetail from "./components/DeviceDetail";
import AddDeviceForm from "./components/AddDeviceForm";
import { devices as initialDevices, createDevice } from "./data/mockData";
import "./App.css";

export default function App() {
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("monstera");
  const [view, setView] = useState("list"); // "list" | "detail" | "add"
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(
    () => ({
      online:  devices.filter((d) => d.status === "online").length,
      warning: devices.filter((d) => d.status === "warning").length,
      offline: devices.filter((d) => d.status === "offline").length,
    }),
    [devices],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices
      .filter((d) => filter === "all" || d.status === filter)
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q),
      );
  }, [devices, search, filter]);

  if (view === "add") {
    return (
      <AddDeviceForm
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
    const openDevice = devices.find((d) => d.id === openId);
    if (openDevice) {
      return (
        <DeviceDetail
          device={openDevice}
          onBack={() => setView("list")}
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
        <Header />
        <StatusSummary counts={counts} total={devices.length} />
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
