import { useState } from "react";
import { bedOf, newsTone, patientStatus, statusToneClass } from "@/lib/wardBoard";
import { Search } from "lucide-react";

/**
 * EHR-style patient list sidebar — searchable roster with bed, NEWS2 and live
 * ward status. Selecting a row drives the banner / NEWS2 / risk widgets.
 */
export default function PatientList({ patients, selectedId, onSelect, now }) {
  const [q, setQ] = useState("");
  const query = q.toLowerCase();
  const filtered = patients.filter((p) =>
    !q || p.name.toLowerCase().includes(query) || bedOf(p).toLowerCase().includes(query) || (p.condition || "").toLowerCase().includes(query)
  );

  return (
    <div className="pf-patient-list rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col max-h-[78vh]">
      <div className="pf-dashboard-header px-4 py-3">
        <h3 className="text-sm font-heading font-bold text-white">Patient List</h3>
        <p className="text-[10px] text-white/80">{patients.length} on ward · live</p>
      </div>
      <div className="p-2.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, bed, condition…"
            className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        {filtered.map((p) => {
          const tone = newsTone(p.initial_news2);
          const status = patientStatus(p, now);
          const isSel = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left rounded-xl border p-2.5 transition-[background-color,border-color,box-shadow] ${isSel ? "border-sky-400 bg-sky-50 ring-1 ring-sky-300" : "border-border bg-card hover:bg-muted/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} aria-hidden="true" />
                  <span className="text-xs font-heading font-bold text-foreground truncate">{p.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{bedOf(p)}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground truncate">{p.condition?.split(",")[0]}</span>
                <span className={`ml-2 shrink-0 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-heading font-bold ${statusToneClass(status.tone)}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold ${tone.text}`}>NEWS2 {p.initial_news2} · {tone.label}</span>
                <span className="text-[10px] text-muted-foreground">· {p.age}y</span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No patients match "{q}"</p>}
      </div>
    </div>
  );
}