import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  Label,
} from "recharts";

const COLORS = {
  green:    "#2EA37A",
  amber:    "#E89A3C",
  ink:      "#1B1F1B",
  inkMuted: "#6B7368",
  border:   "#E5DFD0",
};

const AXIS_TICKS = ["00:00", "06:00", "12:00", "18:00", "now"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const light = payload.find((p) => p.dataKey === "lightPct");
  const temp  = payload.find((p) => p.dataKey === "tempC");
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      {light && (
        <div className="chart-tooltip-row">
          <span className="legend-dot legend-light" />
          <span>light</span>
          <span className="chart-tooltip-value">{light.value}%</span>
        </div>
      )}
      {temp && (
        <div className="chart-tooltip-row">
          <span className="legend-dot legend-temp" />
          <span>temp</span>
          <span className="chart-tooltip-value">{temp.value}°C</span>
        </div>
      )}
    </div>
  );
}

export default function LightHistoryChart({ data }) {
  if (!data?.length) return null;
  const last = data[data.length - 1];

  return (
    <section className="chart-card">
      <header className="chart-head">
        <h2>Light history — last 24 h</h2>
        <div className="chart-legend">
          <span><span className="legend-dot legend-light" /> light %</span>
          <span><span className="legend-dot legend-temp" /> temp °C</span>
        </div>
      </header>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="4 5"
              stroke={COLORS.border}
              vertical={false}
            />
            <XAxis
              dataKey="t"
              ticks={AXIS_TICKS}
              tick={{ fill: COLORS.inkMuted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="light"
              domain={[0, 100]}
              ticks={[40, 75]}
              tick={{ fill: COLORS.inkMuted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <YAxis yAxisId="temp" orientation="right" domain={[15, 35]} hide />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: COLORS.border, strokeDasharray: "3 3" }}
            />
            <Line
              yAxisId="light"
              type="monotone"
              dataKey="lightPct"
              stroke={COLORS.green}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: COLORS.green, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="tempC"
              stroke={COLORS.amber}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.amber, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <ReferenceDot
              yAxisId="light"
              x="now"
              y={last.lightPct}
              r={5}
              fill={COLORS.green}
              stroke="#fff"
              strokeWidth={2}
              isFront
            >
              <Label
                value={`now · ${last.lightPct}%`}
                position="top"
                offset={10}
                fill={COLORS.ink}
                fontSize={11}
                fontWeight={600}
              />
            </ReferenceDot>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
