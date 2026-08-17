import { ClipboardList, Clock, Activity } from "lucide-react";
import { news2Band } from "@/lib/wardPatients";

function NoteCard({ note, index }) {
  const time = new Date(note.timestamp);
  const timeStr = time.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (note.type === "observation") {
    const band = news2Band(note.news2);
    const v = note.vitals || {};
    return (
      <div className="relative pl-6 pb-4">
        <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-clinical-teal border-2 border-white shadow-sm" />
        <div className="absolute left-1.5 top-4 bottom-0 w-px bg-slate-200" />
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-[10px] font-heading font-bold text-slate-600 uppercase"><Activity className="w-3 h-3" /> Clinical Observation</span>
            <span className="text-[10px] text-slate-400 font-mono">{timeStr} · {note.author}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { label: "RR", value: v.rr },
              { label: "SpO₂", value: v.spo2, unit: "%" },
              { label: "SBP", value: v.sbp },
              { label: "HR", value: v.hr },
              { label: "Temp", value: v.temp, unit: "°C" },
              { label: "AVPU", value: v.avpu },
            ].map((item) => (
              <div key={item.label} className="rounded bg-slate-50 border border-slate-100 py-1">
                <div className="text-[9px] text-slate-400 uppercase">{item.label}</div>
                <div className="text-xs font-mono font-bold text-slate-700">{item.value ?? "—"}</div>
              </div>
            ))}
          </div>
          <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${band.bg} ${band.color} ${band.border} border`}>
            NEWS2: {note.news2} — {band.label}
          </div>
        </div>
      </div>
    );
  }

  const isAdmission = note.type === "admission";
  const isHandover = note.type === "handover";

  return (
    <div className="relative pl-6 pb-4">
      <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isAdmission ? "bg-clinical-teal" : "bg-slate-400"}`} />
      <div className="absolute left-1.5 top-4 bottom-0 w-px bg-slate-200" />
      <div className={`rounded-lg border p-3 shadow-sm ${isAdmission ? "border-clinical-teal/30 bg-clinical-teal/5" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-wide ${isAdmission ? "text-clinical-teal" : "text-slate-600"}`}>
            {isAdmission ? <><ClipboardList className="w-3 h-3 text-clinical-teal" /> Admission Note</> : <><Clock className="w-3 h-3 text-slate-500" /> Shift Handover</>}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{timeStr} · {note.author}</span>
        </div>
        <p className={`text-xs leading-relaxed ${isHandover ? "text-slate-700 font-mono" : "text-slate-700"}`}>{note.content}</p>
      </div>
    </div>
  );
}

export default function NursingNotesTab({ nursingNotes = [] }) {
  // Sort: admission first, then chronological
  const sorted = [...nursingNotes].sort((a, b) => {
    if (a.type === "admission" && b.type !== "admission") return -1;
    if (a.type !== "admission" && b.type === "admission") return 1;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wide">Nursing Documentation Timeline</h3>
        <span className="text-[10px] text-slate-400">({sorted.length} entries)</span>
      </div>
      <div>
        {sorted.map((note, i) => <NoteCard key={i} note={note} index={i} />)}
      </div>
    </div>
  );
}