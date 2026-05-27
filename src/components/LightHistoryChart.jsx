const W = 800;
const H = 220;
const PAD_X = 40;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;

const AXIS_LABELS = ["00:00", "06:00", "12:00", "18:00", "now"];
const GRID_LINES = [75, 40];

export default function LightHistoryChart({ data }) {
  const n = data.length;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const x = (i) => PAD_X + (i / (n - 1)) * innerW;
  const yLight = (v) => PAD_TOP + (1 - v / 100) * innerH;
  // Temperature uses its own linear scale (15–35 °C) so the dashed line
  // sits visibly below the light curve instead of getting compressed near 0.
  const yTemp = (v) => PAD_TOP + (1 - (v - 15) / 20) * innerH;

  const lightPath = data
    .map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yLight(d.lightPct).toFixed(1)}`)
    .join(" ");
  const tempPath = data
    .map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yTemp(d.tempC).toFixed(1)}`)
    .join(" ");

  const last = data[n - 1];
  const lastX = x(n - 1);
  const lastY = yLight(last.lightPct);

  return (
    <section className="chart-card">
      <header className="chart-head">
        <h2>Light history — last 24 h</h2>
        <div className="chart-legend">
          <span><span className="legend-dot legend-light" /> light %</span>
          <span><span className="legend-dot legend-temp" /> temp °C</span>
        </div>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label="Light percentage and temperature over the last 24 hours"
      >
        {GRID_LINES.map((v) => (
          <g key={v}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={yLight(v)}
              y2={yLight(v)}
              className="grid-line"
            />
            <text
              x={PAD_X - 8}
              y={yLight(v) + 4}
              textAnchor="end"
              className="grid-label"
            >
              {v}%
            </text>
          </g>
        ))}

        <path d={tempPath} className="line-temp" />
        <path d={lightPath} className="line-light" />

        <circle cx={lastX} cy={lastY} r="4.5" className="now-dot" />
        <g transform={`translate(${lastX - 64}, ${lastY - 28})`}>
          <rect width="58" height="20" rx="6" className="now-pill-bg" />
          <text x="29" y="14" textAnchor="middle" className="now-pill-text">
            now · {last.lightPct}%
          </text>
        </g>

        {AXIS_LABELS.map((label) => {
          const i = data.findIndex((d) => d.t === label);
          if (i < 0) return null;
          return (
            <text
              key={label}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className="axis-label"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}
