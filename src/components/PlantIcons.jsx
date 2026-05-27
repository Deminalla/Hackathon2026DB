const COMMON = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function MonsteraIcon() {
  return (
    <svg {...COMMON}>
      <path d="M12 22V13" />
      <path d="M12 13c-4 0-7-3-8-7 4 0 7 3 8 7z" />
      <path d="M12 13c4 0 7-3 8-7-4 0-7 3-8 7z" />
      <path d="M12 13c-3-1-5-4-5-8 3 1 5 4 5 8z" />
      <path d="M12 13c3-1 5-4 5-8-3 1-5 4-5 8z" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg {...COMMON}>
      <path d="M12 20v-8" />
      <path d="M12 12C9 12 6 10 6 6c3 0 6 2 6 6z" />
      <path d="M12 12c3 0 6-2 6-6-3 0-6 2-6 6z" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg {...COMMON}>
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v6" />
      <path d="M9 21h6" />
    </svg>
  );
}

function SpikeIcon() {
  return (
    <svg {...COMMON}>
      <path d="M8 21V8c0-1 .4-2 1-2s1 1 1 2v13" />
      <path d="M12 21V5c0-1 .4-2 1-2s1 1 1 2v16" />
      <path d="M16 21V9c0-1 .4-2 1-2s1 1 1 2v12" />
      <path d="M5 21h14" />
    </svg>
  );
}

function CactusIcon() {
  return (
    <svg {...COMMON}>
      <path d="M10 21h4" />
      <rect x="10" y="5" width="4" height="16" rx="2" />
      <path d="M10 14H8a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" />
      <path d="M14 12h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

const ICONS = {
  monstera: MonsteraIcon,
  sprout: SproutIcon,
  tree: TreeIcon,
  spike: SpikeIcon,
  cactus: CactusIcon,
};

export function PlantIcon({ variant }) {
  const Cmp = ICONS[variant] ?? MonsteraIcon;
  return <Cmp />;
}
