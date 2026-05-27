const TABS = [
  { key: "all",     label: "All" },
  { key: "online",  label: "Online" },
  { key: "warning", label: "Warning" },
  { key: "offline", label: "Offline" },
];

export default function FilterTabs({ value, onChange }) {
  return (
    <div className="filter-tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          className={`filter-tab ${value === t.key ? "filter-tab-active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
