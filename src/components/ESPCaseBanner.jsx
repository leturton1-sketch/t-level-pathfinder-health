import { useLocation, useNavigate } from "react-router-dom";
import { BriefcaseMedical, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { useESPCase } from "@/lib/ESPCaseContext";

const CONTROLLED_SECTIONS = new Set(["report", "reflect", "review-plan", "update-plan", "quality-check"]);

export default function ESPCaseBanner() {
  const { portfolio, exitCase } = useESPCase();
  const navigate = useNavigate();
  const location = useLocation();
  if (!portfolio || location.pathname === "/esp-practice" || location.pathname === "/") return null;
  const taskNumber = portfolio.active_task?.replace("task-", "") || "1";
  const controlled = CONTROLLED_SECTIONS.has(portfolio.active_section);

  return <aside className="sticky top-0 z-40 border-b border-violet-200 bg-white/95 px-3 py-2 text-slate-900 shadow-md backdrop-blur-xl" aria-label="Active ESP case">
    <div className="mx-auto flex max-w-7xl items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700"><BriefcaseMedical className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700">Active ESP journey</span>
          <span className="text-[9px] font-bold text-slate-500">Task {taskNumber}</span>
          {controlled && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-800"><ShieldCheck className="h-3 w-3" />No AI / internet</span>}
        </div>
        <p className="truncate text-xs font-black text-slate-950">{portfolio.case_name} <span className="font-medium text-slate-500">· {portfolio.active_section?.replaceAll("-", " ")}</span></p>
      </div>
      <button onClick={() => navigate("/esp-practice")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 text-[10px] font-black text-violet-800 hover:bg-violet-100">Return to hub<ChevronRight className="h-3.5 w-3.5" /></button>
      <button onClick={exitCase} aria-label="Exit ESP journey" title="Exit ESP journey" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><LogOut className="h-4 w-4" /></button>
    </div>
  </aside>;
}
