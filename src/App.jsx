import Header from "./components/Header";
import MetricCard from "./components/MetricCard";
import LightHistoryChart from "./components/LightHistoryChart";
import RecommendationCard from "./components/RecommendationCard";
import RecentReadings from "./components/RecentReadings";
import {
  current,
  history24h,
  recent,
  lastReadAgoMin,
  pollIntervalMin,
} from "./data/mockData";
import { classify } from "./utils/lightStatus";
import "./App.css";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

function ThermIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function tempBadge(tempC) {
  if (tempC < 18) return { tone: "muted",  label: "Cold"   };
  if (tempC <= 26) return { tone: "green",  label: "Normal" };
  if (tempC <= 30) return { tone: "amber",  label: "Warm"   };
  return { tone: "danger", label: "Hot" };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function App() {
  const light = classify(current.lightPct);
  const temp = tempBadge(current.tempC);

  return (
    <div className="page">
      <div className="dashboard">
        <Header />
        <section className="metric-row">
          <MetricCard
            icon={<SunIcon />}
            label="Light level"
            value={current.lightPct}
            unit="%"
            badge={{ tone: light.tone, label: capitalize(light.label) }}
          />
          <MetricCard
            icon={<ThermIcon />}
            label="Temperature"
            value={current.tempC}
            unit="°C"
            badge={temp}
          />
          <MetricCard
            icon={<ClockIcon />}
            label="Last read"
            value={lastReadAgoMin}
            unit="min"
            caption={`ago · every ${pollIntervalMin} min`}
          />
        </section>
        <LightHistoryChart data={history24h} />
        <section className="bottom-row">
          <RecommendationCard current={current} />
          <RecentReadings entries={recent} />
        </section>
      </div>
    </div>
  );
}
