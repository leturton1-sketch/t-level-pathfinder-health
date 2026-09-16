import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ALL_BEDS } from "@/lib/wardBoard";
import Widget3DGraphic from "./Widget3DGraphic";
import { ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";

/**
 * Ward occupancy and throughput stats — bed occupancy donut plus live counters
 * for admissions, discharges and escalations.
 */
export default function WardStatsWidget({ patients, incoming, now }) {
  const occupied = patients.length;
  const total = ALL_BEDS.length;
  const available = total - occupied;
  const escalations = patients.filter((p) => p.initial_news2 >= 5).length;
  const discharges = patients.filter((p) => {
    const el = (now - p.admittedAt) / 3600000;
    return p.initial_news2 === 0 && el > 4;
  }).length;
  const data = [
    { name: "Occupied", value: occupied, color: "#0F75D8" },
    { name: "Available", value: available, color: "#E2E8F0" },
  ];

  const stats = [
    { label: "Admissions today", value: patients.filter((p) => (now - p.admittedAt) / 3600000 < 24).length, icon: ArrowDownToLine, tone: "text-sky-600" },
    { label: "Discharge ready", value: discharges, icon: ArrowUpFromLine, tone: "text-emerald-600" },
    { label: "Escalations", value: escalations, icon: AlertTriangle, tone: "text-clinical-red" },
  ];

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Widget3DGraphic type="bed" tone="blue" size="sm" />
        <div>
          <h3 className="text-sm font-heading font-bold text-foreground">Ward Occupancy</h3>
          <p className="text-[10px] text-muted-foreground">{occupied}/{total} beds occupied · {incoming.length} awaiting</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-20 h-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={26} outerRadius={38} paddingAngle={2} startAngle={90} endAngle={-270}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-heading font-bold text-foreground leading-none">{Math.round((occupied / total) * 100)}%</span>
            <span className="text-[8px] text-muted-foreground uppercase">full</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-1.5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className={`w-3.5 h-3.5 ${s.tone}`} /> {s.label}</span>
                <span className="text-sm font-heading font-bold text-foreground">{s.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}