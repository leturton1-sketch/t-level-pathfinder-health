import { useState } from "react";
import { ChevronDown, FileHeart, LockKeyhole, UserRound } from "lucide-react";
import { getESPCase } from "@/lib/espCaseData";
import { useESPCase } from "@/lib/ESPCaseContext";

function Rows({ rows }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{rows.map(([term, value]) => <div key={term} className="rounded-xl border border-slate-200 bg-white p-3"><dt className="text-[10px] font-black uppercase tracking-wide text-sky-700">{term}</dt><dd className="mt-1 text-xs leading-5 text-slate-700">{value}</dd></div>)}</dl>;
}

export default function ESPCaseDossier({ taskId }) {
  const [open, setOpen] = useState(true);
  const { portfolio } = useESPCase();
  const caseData = getESPCase(portfolio?.case_id);
  const taskNumber = Number(taskId?.replace("task-", "") || 1);
  return <section className="rounded-[22px] border border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm">
    <button onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center gap-3 px-5 text-left" aria-expanded={open}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-700 text-white"><FileHeart className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[.16em] text-sky-700">Connected case dossier</span><span className="block truncate text-sm font-black text-slate-950">{caseData.name} · {caseData.setting}</span></span>
      <ChevronDown className={`h-5 w-5 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="border-t border-sky-100 p-5">
      <div className="esp-dark-panel flex flex-wrap gap-4 rounded-2xl bg-slate-950 p-4 text-white"><div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-cyan-300" /><div><p className="text-[10px] font-bold text-slate-400">Individual</p><p className="text-sm font-black">{caseData.name}, {caseData.age} · {caseData.pronouns}</p></div></div><p className="min-w-[240px] flex-1 text-xs leading-5 text-slate-300">{caseData.employerBrief}</p></div>
      <h3 className="mb-3 mt-5 text-xs font-black uppercase tracking-wide text-slate-700">Information available from Task 1</h3><Rows rows={caseData.baseline} />
      {taskNumber >= 2 ? <><h3 className="mb-3 mt-5 text-xs font-black uppercase tracking-wide text-slate-700">Information released for Task 2</h3><Rows rows={caseData.task2Update} /></> : <Locked label="Task 2 interaction evidence" />}
      {taskNumber >= 3 ? <><h3 className="mb-3 mt-5 text-xs font-black uppercase tracking-wide text-slate-700">Information released for Task 3</h3><Rows rows={caseData.task3Update} /></> : <Locked label="Task 3 care-plan update" />}
      {taskNumber >= 4 ? <><h3 className="mb-3 mt-5 text-xs font-black uppercase tracking-wide text-slate-700">Information released for Task 4</h3><Rows rows={caseData.task4Update} /></> : <Locked label="Task 4 handover instructions" />}
    </div>}
  </section>;
}

function Locked({ label }) {
  return <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-500"><LockKeyhole className="h-4 w-4" />{label} remains locked until the relevant task.</div>;
}
