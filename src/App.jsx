import { useMemo, useState } from "react";
import Header from "./components/Header";
import StatusSummary from "./components/StatusSummary";
import SearchFilter from "./components/SearchFilter";
import FilterTabs from "./components/FilterTabs";
import DeviceCard from "./components/DeviceCard";
import AddDeviceCard from "./components/AddDeviceCard";
import DeviceDetail from "./components/DeviceDetail";
import { devices } from "./data/mockData";
import "./App.css";

export default function App() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("monstera");
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(
    () => ({
      online:  devices.filter((d) => d.status === "online").length,
      warning: devices.filter((d) => d.status === "warning").length,
      offline: devices.filter((d) => d.status === "offline").length,
    }),
    [],
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
  }, [search, filter]);

  const openDevice = openId ? devices.find((d) => d.id === openId) : null;
  if (openDevice) {
    return <DeviceDetail device={openDevice} onBack={() => setOpenId(null)} />;
  }

  const handleOpen = (id) => {
    setSelectedId(id);
    setOpenId(id);
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
          <AddDeviceCard />
        </div>
      </div>
    </div>
  );
}
