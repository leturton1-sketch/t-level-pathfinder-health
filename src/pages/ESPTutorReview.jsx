import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, RefreshCw, Save, Search, ShieldAlert, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { canManageUsers } from "@/lib/clinicalAuth";

const TITLES = {
  "task-1:brief": "T1 Brief plan", "task-1:research": "T1 Research", "task-1:report": "T1 Report",
  "task-2:prepare": "T2 Preparation", "task-2:roleplay": "T2 Role play", "task-2:reflect": "T2 Reflection",
  "task-3:review-plan": "T3 Plan review", "task-3:update-plan": "T3 Plan update", "task-3:quality-check": "T3 Quality check",
  "task-4:handover": "T4 Handover", "task-4:present": "T4 Presentation", "task-4:questions": "T4 Questions",
};
function parse(value) { try { return JSON.parse(value || "{}"); } catch { return {}; } }

export default function ESPTutorReview() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const allowed = canManageUsers();

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ESPPortfolio.list("-updated_date", 200);
      setRows(data || []);
      if (!selectedId && data?.[0]) setSelectedId(data[0].id);
    } catch { setRows([]); }
    setLoading(false);
  };
  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);
  const selected = rows.find((row) => row.id === selectedId);
  useEffect(() => { setFeedback(selected?.tutor_feedback || ""); }, [selectedId, selected?.tutor_feedback]);
  const filtered = rows.filter((row) => `${row.student_name} ${row.case_name} ${row.status}`.toLowerCase().includes(query.toLowerCase()));
  const evidence = parse(selected?.workspace_evidence);
  const progress = parse(selected?.section_progress);

  const saveReview = async (status = selected?.status || "in_progress") => {
    if (!selected) return;
    const updated = await base44.entities.ESPPortfolio.update(selected.id, { tutor_feedback: feedback, status });
    setRows((value) => value.map((row) => row.id === selected.id ? { ...row, ...updated, tutor_feedback: feedback, status } : row));
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  };

  if (!allowed) return <main className="clinical-page-shell"><div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><ShieldAlert className="h-7 w-7 text-amber-700" /><h1 className="mt-3 text-xl font-black text-amber-950">Tutor access required</h1><p className="mt-2 text-sm text-amber-900">ESP portfolio review is restricted to tutors and administrators.</p></div></main>;

  return <main className="esp-surface clinical-page-shell min-h-screen bg-slate-50 pb-28">
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button onClick={() => navigate("/")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft className="h-4 w-4" />Overview</button>
        <button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>
      <header className="esp-dark-panel rounded-[28px] bg-slate-950 p-7 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Tutor workspace</p><h1 className="mt-2 text-3xl font-black">ESP portfolio review</h1><p className="mt-2 text-sm text-slate-300">Review the complete evidence chain, provide holistic feedback and release a reviewed status.</p></header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-[22px] border border-white bg-white p-4 shadow-sm">
          <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learners…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-sky-500" /></label>
          <div className="mt-3 space-y-2">
            {loading && <p className="p-4 text-center text-xs text-slate-500">Loading portfolios…</p>}
            {!loading && filtered.length === 0 && <p className="p-4 text-center text-xs text-slate-500">No ESP portfolios found.</p>}
            {filtered.map((row) => {
              const done = Object.values(parse(row.section_progress)).filter(Boolean).length;
              return <button key={row.id} onClick={() => setSelectedId(row.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === row.id ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sky-700" /><span className="truncate text-sm font-black text-slate-900">{row.student_name || "Learner"}</span></div><p className="mt-1 text-xs text-slate-500">{row.case_name} · {done}/12 complete</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">{row.status?.replaceAll("_", " ")}</span></button>;
            })}
          </div>
        </aside>

        <section>
          {!selected ? <div className="rounded-[22px] border border-white bg-white p-10 text-center shadow-sm"><ClipboardCheck className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">Select a learner portfolio.</p></div> : <>
            <div className="rounded-[22px] border border-white bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-sky-700">Connected case · {selected.case_name}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{selected.student_name || "Learner"}</h2><p className="mt-1 text-xs text-slate-500">Last active: {selected.active_task?.replace("-", " ")} · {selected.active_section?.replaceAll("-", " ")}</p></div><p className="text-3xl font-black text-emerald-700">{Object.values(progress).filter(Boolean).length}/12</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(TITLES).map(([key, title]) => {
              const values = evidence[key] || {}; const has = Object.values(values).some((value) => value?.trim());
              return <article key={key} className={`rounded-2xl border p-4 ${progress[key] ? "border-emerald-200 bg-emerald-50" : has ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="flex items-center gap-2">{progress[key] && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}<h3 className="text-xs font-black text-slate-900">{title}</h3></div><p className="mt-2 text-[10px] font-bold uppercase text-slate-500">{progress[key] ? "Complete" : has ? "Draft evidence" : "Not started"}</p><div className="mt-3 max-h-32 space-y-2 overflow-y-auto">{Object.entries(values).map(([field, value]) => value?.trim() && <p key={field} className="text-[10px] leading-4 text-slate-600"><strong>{field.replaceAll("_", " ")}:</strong> {value.slice(0, 180)}{value.length > 180 ? "…" : ""}</p>)}</div></article>;
            })}</div>
            <div className="mt-4 rounded-[22px] border border-white bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Holistic tutor feedback</h2><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={8} placeholder="Record strengths, evidence against AO1–AO5 and precise next steps…" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-sky-500" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => saveReview(selected.status)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"><Save className="h-4 w-4" />{saved ? "Saved" : "Save feedback"}</button><button onClick={() => saveReview("reviewed")} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white">Mark reviewed<CheckCircle2 className="h-4 w-4" /></button></div></div>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
