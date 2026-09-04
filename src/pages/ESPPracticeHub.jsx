import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2,
  ClipboardCheck, FileText, LockKeyhole, Presentation, RotateCcw,
  ShieldCheck, Target, UsersRound,
} from "lucide-react";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { useESPCase } from "@/lib/ESPCaseContext";

const AOS = {
  AO1: { label: "Plan an approach to the brief", marks: 9, pct: 7 },
  AO2: { label: "Apply core knowledge and core skills", marks: 57, pct: 45 },
  AO3: { label: "Select relevant techniques and resources for the individual", marks: 36, pct: 29 },
  AO4: { label: "Use maths, English and digital skills appropriately", marks: 15, pct: 12 },
  AO5: { label: "Realise and review the project outcome", marks: 9, pct: 7 },
};

const TASKS = [
  {
    id: "task-1", number: "01", title: "Research and report", duration: "4h 30m", marks: 42,
    icon: FileText, tone: "from-violet-600 to-fuchsia-600",
    summary: "Interpret the brief, research reliable evidence and produce a focused professional report.",
    conditions: "Activity 1a permits supervised internet research. Activity 1b uses research notes only, with no internet or generative AI.",
    aos: ["AO1", "AO2", "AO3", "AO4", "AO5"],
    sections: [
      { id: "brief", title: "Interpret and plan the brief", outcome: "A clear plan responding to the employer need, audience, constraints and intended outcome.", skills: ["SK13", "SK18"], pos: ["PO1", "PO3", "PO5"], aos: ["AO1", "AO3"], href: "/theory", action: "Open practice section" },
      { id: "research", title: "Research and evaluate evidence", outcome: "Relevant, credible evidence selected and recorded with traceable sources.", skills: ["SK13", "SK18"], pos: ["PO3", "PO4", "PO5"], aos: ["AO2", "AO3", "AO4"], href: "/knowledge-library", action: "Open practice section" },
      { id: "report", title: "Produce the research report", outcome: "A structured report applying evidence to the individual and reaching justified conclusions.", skills: ["SK10", "SK13", "SK14", "SK18"], pos: ["PO3", "PO4", "PO5"], aos: ["AO2", "AO3", "AO4", "AO5"], href: "/voice-assistant", action: "Open practice section" },
    ],
  },
  {
    id: "task-2", number: "02", title: "Role play and reflection", duration: "1h 15m", marks: 33,
    icon: UsersRound, tone: "from-cyan-500 to-blue-700",
    summary: "Use person-centred communication in a role play, then reflect using notes and tutor feedback.",
    conditions: "The research report may be used in Activity 2a. Activity 2b uses role-play notes and tutor feedback; no internet or generative AI.",
    aos: ["AO1", "AO2", "AO3", "AO4", "AO5"],
    sections: [
      { id: "prepare", title: "Prepare for the interaction", outcome: "An appropriate communication plan based on the individual, evidence and professional boundaries.", skills: ["SK9", "SK10", "SK11", "SK13"], pos: ["PO1", "PO3", "PO5", "PO7"], aos: ["AO1", "AO2", "AO3"], href: "/interactive-learning", action: "Open practice section" },
      { id: "roleplay", title: "Complete the person-centred role play", outcome: "A safe, respectful interaction using active listening, suitable questions and reasonable adaptations.", skills: ["SK8", "SK9", "SK10", "SK11"], pos: ["PO2", "PO5", "PO6", "PO7"], aos: ["AO2", "AO3", "AO4"], href: "/ward-simulation", action: "Open practice section" },
      { id: "reflect", title: "Reflect and identify improvements", outcome: "A balanced reflective account using feedback to identify strengths and actionable improvements.", skills: ["SK12", "SK18"], pos: ["PO3", "PO4", "PO5"], aos: ["AO2", "AO4", "AO5"], href: "/care-planning/tool/reflective-practice-log", action: "Open practice section" },
    ],
  },
  {
    id: "task-3", number: "03", title: "Update a care plan", duration: "1h 30m", marks: 18,
    icon: ClipboardCheck, tone: "from-emerald-500 to-teal-700",
    summary: "Use the accumulated evidence to update an existing care plan accurately and person-centredly.",
    conditions: "The Task 1 report, Task 2 notes and supplied care plan may be used. No internet or generative AI.",
    aos: ["AO2", "AO3", "AO4", "AO5"],
    sections: [
      { id: "review-plan", title: "Review the existing plan and new evidence", outcome: "Changed needs, risks, preferences and priorities are identified before editing.", skills: ["SK1", "SK2", "SK4", "SK9", "SK13"], pos: ["PO3", "PO4", "PO5", "PO6", "PO7"], aos: ["AO2", "AO3"], href: "/care-planning", action: "Open practice section" },
      { id: "update-plan", title: "Update needs, goals and interventions", outcome: "SMART, evidence-based actions identify responsibility, timescale and review arrangements.", skills: ["SK3", "SK4", "SK5", "SK9", "SK17", "SK18"], pos: ["PO2", "PO3", "PO4", "PO5", "PO6"], aos: ["AO2", "AO3", "AO4"], href: "/care-planning/shared", action: "Open practice section" },
      { id: "quality-check", title: "Evaluate the updated plan", outcome: "The final plan is checked for safety, accuracy, individualisation and fitness for purpose.", skills: ["SK8", "SK12", "SK18"], pos: ["PO2", "PO3", "PO5", "PO7"], aos: ["AO2", "AO5"], href: "/care-planning/smart-goals", action: "Open practice section" },
    ],
  },
  {
    id: "task-4", number: "04", title: "Handover presentation and questions", duration: "2h 30m", marks: 33,
    icon: Presentation, tone: "from-amber-500 to-orange-600",
    summary: "Create and deliver a concise handover presentation, then answer questions using the project evidence.",
    conditions: "The Task 1 report, tutor notes and reflective account from Task 2, and updated care plan from Task 3 may be used.",
    aos: ["AO1", "AO2", "AO3", "AO4", "AO5"],
    sections: [
      { id: "handover", title: "Select and structure the handover", outcome: "The most relevant clinical information is prioritised in a logical SBAR structure.", skills: ["SK1", "SK6", "SK10", "SK13", "SK18"], pos: ["PO3", "PO4", "PO5"], aos: ["AO1", "AO2", "AO3"], href: "/care-planning/shared", action: "Open practice section" },
      { id: "present", title: "Deliver the presentation", outcome: "Information is communicated accurately, professionally and appropriately for the audience.", skills: ["SK6", "SK10", "SK11", "SK14"], pos: ["PO1", "PO3", "PO4", "PO5"], aos: ["AO2", "AO4"], href: "/voice-assistant", action: "Open practice section" },
      { id: "questions", title: "Respond to questions and review", outcome: "Answers are justified from the evidence and the final outcome is critically reviewed against the brief.", skills: ["SK10", "SK12", "SK13", "SK14"], pos: ["PO1", "PO4", "PO5"], aos: ["AO2", "AO3", "AO5"], href: "/performance", action: "Open practice section" },
    ],
  },
];

function MappingChip({ code, text, kind }) {
  const classes = kind === "ao"
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : kind === "po"
      ? "border-violet-300 bg-violet-50 text-violet-900"
      : "border-cyan-300 bg-cyan-50 text-cyan-900";
  return <span title={text} className={`inline-flex cursor-help rounded-lg border px-2 py-1 text-[10px] font-black ${classes}`}>{code}</span>;
}

export default function ESPPracticeHub() {
  const navigate = useNavigate();
  const { portfolio, startCase, enterSection, setSectionComplete, resetProgress } = useESPCase();
  const [activeTask, setActiveTask] = useState(portfolio?.active_task || "task-1");
  let progress = {};
  try { progress = JSON.parse(portfolio?.section_progress || "{}"); } catch {}
  useEffect(() => { if (!portfolio) startCase(); }, [portfolio]);
  const task = TASKS.find((item) => item.id === activeTask) || TASKS[0];
  const ActiveTaskIcon = task.icon;
  const totalSections = TASKS.reduce((sum, item) => sum + item.sections.length, 0);
  const complete = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);
  const pct = Math.round((complete / totalSections) * 100);

  const toggle = (id) => setSectionComplete(id, !progress[id]);
  const launchSection = async (section) => {
    await enterSection(task.id, section.id);
    navigate(`/esp-practice/${task.id}/${section.id}`);
  };

  return (
    <main className="esp-surface clinical-page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(118,90,176,.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(39,181,168,.12),transparent_30%)] pb-32">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate("/")} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-white/70">
          <ArrowLeft className="h-4 w-4" /> Pathfinder overview
        </button>

        <section className="esp-dark-panel no-command-panel overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_340px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Pearson T Level Health · Formative practice</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Employer Set Project Practice Hub</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Follow one connected project journey from research to professional handover. Every section shows the assessment objectives, core skill set and performance outcomes it develops.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white/10 px-3 py-1.5">4 linked tasks</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">9h 45m total</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">126 marks</span>
                <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-200">Original practice — not live assessment material</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Journey progress</p><p className="mt-1 text-4xl font-black">{pct}%</p></div><p className="text-sm font-bold text-cyan-300">{complete}/{totalSections} sections</p></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${pct}%` }} /></div>
              <button onClick={resetProgress} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Reset practice progress</button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="ESP tasks">
          {TASKS.map((item) => {
            const Icon = item.icon;
            const done = item.sections.filter((section) => progress[`${item.id}:${section.id}`]).length;
            return <button key={item.id} onClick={() => setActiveTask(item.id)} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${activeTask === item.id ? "border-violet-400 bg-white ring-4 ring-violet-100" : "border-white bg-white/85"}`}>
              <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${item.tone} text-white`}><Icon className="h-5 w-5" /></span><span className="text-xs font-black text-slate-400">{item.number}</span></div>
              <h2 className="mt-3 font-black text-slate-950">{item.title}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">{item.duration} · {item.marks} marks</p>
              <p className="mt-3 text-[11px] font-bold text-violet-700">{done}/{item.sections.length} sections checked</p>
            </button>;
          })}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_310px]">
          <section>
            <div className="rounded-[26px] border border-white bg-white/90 p-5 shadow-lg sm:p-6">
              <div className="flex items-start gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${task.tone} text-white`}><ActiveTaskIcon className="h-6 w-6" /></span>
                <div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Task {task.number} · {task.duration} · {task.marks} marks</p><h2 className="mt-1 text-2xl font-black text-slate-950">{task.title}</h2><p className="mt-2 text-sm leading-6 text-slate-700">{task.summary}</p></div>
              </div>
              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-xs font-black uppercase tracking-wide text-amber-900">Practice conditions</p><p className="mt-1 text-xs leading-5 text-amber-900">{task.conditions}</p></div></div>
            </div>

            <div className="mt-4 space-y-4">
              {task.sections.map((section, index) => {
                const key = `${task.id}:${section.id}`;
                const isDone = !!progress[key];
                return <article key={section.id} className="rounded-[24px] border border-white bg-white/90 p-5 shadow-md">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggle(key)} aria-pressed={isDone} aria-label={isDone ? `Mark ${section.title} incomplete` : `Mark ${section.title} complete`} className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${isDone ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-400 hover:border-emerald-500"}`}>{isDone ? <Check className="h-5 w-5" /> : <span className="text-xs font-black">{index + 1}</span>}</button>
                    <div className="min-w-0 flex-1"><h3 className="text-lg font-black text-slate-950">{section.title}</h3><p className="mt-1 text-sm leading-6 text-slate-700">{section.outcome}</p></div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Direct curriculum mapping</p>
                    <div className="flex flex-wrap gap-1.5">
                      {section.aos.map((code) => <MappingChip key={code} code={code} text={AOS[code].label} kind="ao" />)}
                      {section.skills.map((code) => <MappingChip key={code} code={code} text={SK_CODES[code]} kind="sk" />)}
                      {section.pos.map((code) => <MappingChip key={code} code={code} text={PERFORMANCE_OUTCOMES[code]} kind="po" />)}
                    </div>
                  </div>
                  <button onClick={() => launchSection(section)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-violet-700 sm:w-auto">{section.action}<ArrowRight className="h-4 w-4" /></button>
                </article>;
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-white bg-white/90 p-5 shadow-md">
              <div className="flex items-center gap-2"><Target className="h-5 w-5 text-violet-700" /><h2 className="font-black text-slate-950">Assessment objectives</h2></div>
              <div className="mt-4 space-y-3">{Object.entries(AOS).map(([code, ao]) => <div key={code}><div className="flex items-center justify-between"><span className="text-xs font-black text-slate-900">{code}</span><span className="text-[10px] font-bold text-slate-500">{ao.marks} marks · {ao.pct}%</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{ao.label}</p></div>)}</div>
            </section>
            <section className="rounded-[24px] border border-cyan-200 bg-cyan-50 p-5 shadow-md">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-800" /><h2 className="font-black text-cyan-950">Assessment integrity</h2></div>
              <p className="mt-2 text-xs leading-5 text-cyan-950">Pathfinder supports teaching and formative rehearsal. During controlled practice, follow the displayed resource rules and do not use Pathfinder AI where internet or generative AI is prohibited.</p>
            </section>
            <section className="rounded-[24px] border border-white bg-white/90 p-5 shadow-md">
              <div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-emerald-700" /><h2 className="font-black text-slate-950">Evidence journey</h2></div>
              <ol className="mt-3 space-y-2 text-xs text-slate-700">{["Research notes and report","Role-play notes, feedback and reflection","Updated person-centred care plan","Handover presentation and responses"].map((label, index) => <li key={label} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /><span><strong>Task {index + 1}:</strong> {label}</span></li>)}</ol>
              <button onClick={() => navigate("/esp-practice/portfolio")} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white hover:bg-emerald-800"><FileText className="h-4 w-4" />Review connected portfolio</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
