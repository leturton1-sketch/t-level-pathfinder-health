import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { newsTone } from "@/lib/wardBoard";
import Widget3DGraphic from "./Widget3DGraphic";
import { Wind, Droplet, Activity, Heart, Thermometer } from "lucide-react";

const RANGES = {
  rr: [12, 20], spo2: [96, 100], sbp: [90, 120], hr: [60, 100], temp: [36, 37.5],
};

function jitter(base) {
  if (base == null) return null;
  const drift = (Math.random() - 0.5) * Math.max(1, base * 0.03);
  return Math.round((base + drift) * 10) / 10;
}

/**
 * Live NEWS2 monitor — vitals drift in real time and a trend sparkline builds
 * from the running observations.
 */
export default function NEWS2LiveWidget({ patient }) {
  const base = patient?.initial_vitals || {};
  const [vitals, setVitals] = useState(base);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setVitals(base);
    const seed = Array.from({ length: 8 }).map((_, i) => ({ i, hr: jitter(base.hr) ?? 80 }));
    setHistory(seed);
    const id = setInterval(() => {
      setVitals((prev) => ({
        ...prev,
        rr: jitter(prev.rr ?? base.rr),
        spo2: jitter(prev.spo2 ?? base.spo2),
        sbp: jitter(prev.sbp ?? base.sbp),
        hr: jitter(prev.hr ?? base.hr),
        temp: jitter(prev.temp ?? base.temp),
      }));
      setHistory((prev) => [...prev.slice(-11), { hr: jitter(base.hr) ?? 80 }]);
    }, 4000);
    return () => clearInterval(id);
  }, [patient?.id]);

  if (!patient) return null;
  const tone = newsTone(patient.initial_news2);
  const cells = [
    { k: "rr", l: "RR", icon: Wind, u: "br/min" },
    { k: "spo2", l: "SpO₂", icon: Droplet, u: "%" },
    { k: "sbp", l: "SBP", icon: Activity, u: "mmHg" },
    { k: "hr", l: "HR", icon: Heart, u: "bpm" },
    { k: "temp", l: "Temp", icon: Thermometer, u: "°C" },
  ];

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Widget3DGraphic type="vitals" tone="pink" size="sm" />
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground">NEWS2 Live Monitor</h3>
            <p className="text-[10px] text-muted-foreground">Live observations · auto-updating</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-heading font-bold ${tone.border} ${tone.bg} ${tone.text}`}>
          {patient.initial_news2} · {tone.label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {cells.map((c) => {
          const val = vitals[c.k];
          const [lo, hi] = RANGES[c.k];
          const abnormal = val != null && (val < lo || val > hi);
          const Icon = c.icon;
          return (
            <div key={c.k} className={`rounded-lg border p-1.5 text-center ${abnormal ? "border-clinical-amber/40 bg-clinical-amber/10" : "border-sky-100 bg-sky-50"}`}>
              <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${abnormal ? "text-clinical-amber" : "text-clinical-teal"}`} />
              <div className={`text-sm font-heading font-bold leading-none ${abnormal ? "text-clinical-amber" : "text-foreground"}`}>{val ?? "—"}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5">{c.l}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <Line type="monotone" dataKey="hr" stroke="#765AB0" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #D8DEE6" }} formatter={(v) => [`${v} bpm`, "HR"]} labelFormatter={() => ""} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}