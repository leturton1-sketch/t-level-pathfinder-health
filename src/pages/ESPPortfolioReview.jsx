import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardList, FileText, Printer, Send, ShieldCheck } from "lucide-react";
import { useESPCase } from "@/lib/ESPCaseContext";

const SECTION_NAMES = {
  "task-1:brief": "Task 1 · Interpret and plan the brief",
  "task-1:research": "Task 1 · Research and evaluate evidence",
  "task-1:report": "Task 1 · Research report",
  "task-2:prepare": "Task 2 · Interaction preparation",
  "task-2:roleplay": "Task 2 · Person-centred role play",
  "task-2:reflect": "Task 2 · Reflective account",
  "task-3:review-plan": "Task 3 · Review existing plan",
  "task-3:update-plan": "Task 3 · Updated care plan",
  "task-3:quality-check": "Task 3 · Care-plan evaluation",
  "task-4:handover": "Task 4 · SBAR handover",
  "task-4:present": "Task 4 · Presentation",
  "task-4:questions": "Task 4 · Questions and final review",
};

function parse(value) { try { return JSON.parse(value || "{}"); } catch { return {}; } }
function label(value) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default function ESPPortfolioReview() {
  const navigate = useNavigate();
  const { portfolio, updatePortfolio } = useESPCase();
  const evidence = parse(portfolio?.workspace_evidence);
  const progress = parse(portfolio?.section_progress);
  const completed = Object.values(progress).filter(Boolean).length;
  const allComplete = completed === Object.keys(SECTION_NAMES).length;
  const isSubmitted = portfolio?.status === "submitted" || portfolio?.status === "reviewed";

  if (!portfolio) return <main className="clinical-page-shell"><p>No active ESP portfolio.</p><button onClick={() => navigate("/esp-practice")}>Start in the ESP Hub</button></main>;

  return <main className="esp-surface clinical-page-shell min-h-screen bg-slate-50 pb-28 print:bg-white">
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button onClick={() => navigate("/esp-practice")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft className="h-4 w-4" />ESP Practice Hub</button>
        <button onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white"><Printer className="h-4 w-4" />Print / save PDF</button>
      </div>

      <header className="esp-dark-panel rounded-[28px] bg-slate-950 p-7 text-white shadow-xl print:rounded-none print:bg-white print:p-0 print:text-black print:shadow-none">
        <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300 print:text-slate-600">Pathfinder Health · Original formative ESP practice</p>
        <h1 className="mt-2 text-3xl font-black">Connected evidence portfolio</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase text-slate-400">Learner</p><p className="font-black">{portfolio.student_name || "Learner"}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-slate-400">Case</p><p className="font-black">{portfolio.case_name}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-slate-400">Progress</p><p className="font-black">{completed}/12 sections</p></div>
        </div>
      </header>

      <section className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 print:border-slate-300 print:bg-white">
        <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-cyan-800" /><div><h2 className="font-black text-cyan-950">Portfolio purpose</h2><p className="mt-1 text-xs leading-5 text-cyan-950">This view consolidates practice evidence for tutor review and learner reflection. It is not a Pearson submission or official mark record.</p></div></div>
      </section>

      <div className="mt-5 space-y-5">
        {Object.entries(SECTION_NAMES).map(([key, title]) => {
          const values = evidence[key] || {};
          const hasEvidence = Object.values(values).some((value) => value?.trim());
          return <article key={key} className="break-inside-avoid rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm print:rounded-none print:shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${progress[key] ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{progress[key] ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}</span><div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{progress[key] ? "Marked complete" : hasEvidence ? "Draft evidence" : "Not started"}</p></div></div>
              <button onClick={() => { const [taskId, sectionId] = key.split(":"); navigate(`/esp-practice/${taskId}/${sectionId}`); }} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 print:hidden">Open</button>
            </div>
            {hasEvidence ? <dl className="mt-4 space-y-4 border-t border-slate-100 pt-4">{Object.entries(values).map(([field, value]) => value?.trim() && <div key={field}><dt className="text-xs font-black text-violet-800">{label(field)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</dd></div>)}</dl> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No evidence saved for this section.</p>}
          </article>;
        })}
      </div>

      <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-700" /><h2 className="font-black text-slate-950">Tutor review</h2></div>
        <div className="mt-3 min-h-32 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 print:border-slate-300">
          {portfolio.tutor_feedback || "Tutor feedback will appear here after your portfolio has been reviewed."}
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-violet-200 bg-violet-50 p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-violet-950">Submit for tutor review</h2>
            <p className="mt-1 text-xs leading-5 text-violet-900">{isSubmitted ? "Your connected portfolio has been sent to the teaching team." : allComplete ? "All 12 sections are complete. You can now send this practice portfolio for feedback." : `Complete all 12 sections before submitting. ${12 - completed} remaining.`}</p>
          </div>
          <button disabled={!allComplete || isSubmitted} onClick={() => updatePortfolio({ status: "submitted" })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSubmitted ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}{isSubmitted ? "Submitted" : "Submit portfolio"}
          </button>
        </div>
      </section>
    </div>
  </main>;
}
