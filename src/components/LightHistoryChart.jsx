import { useMemo } from "react";
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
import { formatTempC } from "../utils/formatSensor";

const COLORS = {
  green:    "#2EA37A",
  amber:    "#E89A3C",
  ink:      "#1B1F1B",
  inkMuted: "#6B7368",
  border:   "#E5DFD0",
};

function formatAxisTime(t) {
  const d = new Date(Number(t));
  if (Number.isNaN(d.getTime())) return String(t);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const light = payload.find((p) => p.dataKey === "lightPct");
  const temp  = payload.find((p) => p.dataKey === "tempC");
  const timeLabel = formatAxisTime(label);
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{timeLabel}</div>
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
          <span className="chart-tooltip-value">{formatTempC(temp.value)}°C</span>
        </div>
      )}
    </div>
  );
}

export default function LightHistoryChart({ data }) {
  const temps = useMemo(
    () => (data ?? []).map((d) => d.tempC).filter((v) => Number.isFinite(v)),
    [data],
  );

  const tempDomain = useMemo(() => {
    if (temps.length === 0) return [18, 32];
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const pad = Math.max(0.5, (max - min) * 0.25);
    return [min - pad, max + pad];
  }, [temps]);

  if (!data?.length) return null;
  const last = data[data.length - 1];

  return (
    <section className="chart-card">
      <header className="chart-head">
        <h2>Live sensor history</h2>
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
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatAxisTime}
              tick={{ fill: COLORS.inkMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
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
            <YAxis yAxisId="temp" orientation="right" domain={tempDomain} hide />
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
              x={last.t}
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
