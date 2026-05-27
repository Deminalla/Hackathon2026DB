function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default function SearchFilter({ value, onChange }) {
  return (
    <div className="search-filter-row">
      <label className="search-input">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search devices..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search devices"
        />
      </label>
      <button type="button" className="filter-btn">
        <FilterIcon />
        <span>Filter</span>
      </button>
    </div>
  );
}
