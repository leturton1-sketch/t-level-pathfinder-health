import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock3,
  ExternalLink, FileCheck2, Pause, Play, RotateCcw, Save, ShieldAlert,
  Sparkles, Target, UsersRound,
} from "lucide-react";
import { useESPCase } from "@/lib/ESPCaseContext";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import ESPCaseDossier from "@/components/ESPCaseDossier";

const MODULES = {
  "task-1:brief": {
    task: "Task 1", title: "Interpret and plan the brief", minutes: 30, controlled: false,
    purpose: "Turn the employer brief into a clear, manageable project plan before beginning research.",
    aos: ["AO1", "AO3"], skills: ["SK13", "SK18"], pos: ["PO1", "PO3", "PO5"],
    fields: [
      ["employer_need", "Employer need and required outcome", "What problem must your work address, and what must you ultimately produce?"],
      ["audience", "Individual and audience", "Identify who the outcome is for, their needs and the professional audience."],
      ["constraints", "Constraints and assessment requirements", "Record time, resource, confidentiality, scope and evidence constraints."],
      ["project_plan", "Planned approach", "Set out your sequence, milestones, evidence needs and checks for success."],
    ],
    checklist: ["The employer need is explicit", "The individual remains central", "Times and permitted resources are recorded", "The plan includes review points"],
    resource: ["/theory", "Open core theory"],
  },
  "task-1:research": {
    task: "Task 1", title: "Research and evaluate evidence", minutes: 120, controlled: false,
    purpose: "Collect credible evidence and judge how useful it is for this individual and brief.",
    aos: ["AO2", "AO3", "AO4"], skills: ["SK13", "SK18"], pos: ["PO3", "PO4", "PO5"],
    fields: [
      ["search_questions", "Focused research questions", "What do you need to find out to meet the brief?"],
      ["source_log", "Source evaluation log", "For each source record title/organisation, date, main finding, credibility, limitations and relevance."],
      ["evidence_comparison", "Compare and select evidence", "Where do sources agree or differ? Which evidence is most appropriate and why?"],
      ["research_notes", "Concise research notes", "Paraphrase the evidence you will be permitted to use during report writing."],
    ],
    checklist: ["Sources are current and authoritative", "Claims can be traced to sources", "Limitations or bias are considered", "Selection is justified for the case"],
    resource: ["/knowledge-library", "Open knowledge library"],
  },
  "task-1:report": {
    task: "Task 1", title: "Produce the research report", minutes: 120, controlled: true,
    purpose: "Apply the selected evidence to the case and produce a coherent professional report.",
    aos: ["AO2", "AO3", "AO4", "AO5"], skills: ["SK10", "SK13", "SK14", "SK18"], pos: ["PO3", "PO4", "PO5"],
    fields: [
      ["report_introduction", "Introduction and scope", "State the purpose, case context and structure without retelling the whole brief."],
      ["report_analysis", "Evidence-based analysis", "Apply evidence to Amira's needs. Compare options, explain implications and justify selections."],
      ["report_recommendations", "Recommendations", "Give specific, prioritised and feasible recommendations with clear rationale."],
      ["report_conclusion", "Conclusion and reference list", "Reach a reasoned conclusion and provide a consistent reference list."],
    ],
    checklist: ["Evidence is applied rather than described", "Recommendations are justified", "Professional English is used", "The conclusion answers the brief"],
  },
  "task-2:prepare": {
    task: "Task 2", title: "Prepare for the interaction", minutes: 15, controlled: true,
    purpose: "Plan a safe, person-centred conversation using the report and case information.",
    aos: ["AO1", "AO2", "AO3"], skills: ["SK9", "SK10", "SK11", "SK13"], pos: ["PO1", "PO3", "PO5", "PO7"],
    fields: [
      ["interaction_aims", "Interaction aims", "What must you understand, explain or agree during the role play?"],
      ["question_plan", "Question and listening plan", "Draft open questions, prompts and ways to check understanding."],
      ["adaptations", "Communication adaptations", "How will you respond to anxiety, culture, language, capacity, sensory or health-literacy needs?"],
    ],
    checklist: ["Questions are open and purposeful", "Consent and confidentiality are addressed", "Adaptations are individualised", "Role boundaries and escalation are clear"],
    resource: ["/interactive-learning", "Open communication practice"],
  },
  "task-2:roleplay": {
    task: "Task 2", title: "Person-centred role play", minutes: 30, controlled: true,
    purpose: "Conduct the interaction and capture only the notes permitted for reflection.",
    aos: ["AO2", "AO3", "AO4"], skills: ["SK8", "SK9", "SK10", "SK11"], pos: ["PO2", "PO5", "PO6", "PO7"],
    scenario: "Amira is worried that worsening breathlessness will reduce her independence. She feels previous appointments focused on clinical measurements and not her priorities. Explore her concerns, clarify what matters to her and agree safe next steps within your role.",
    fields: [
      ["roleplay_notes", "Contemporaneous notes", "Record key information learned, agreed actions, concerns and any required escalation."],
      ["communication_evidence", "Communication evidence", "Note where you used active listening, clarification, empathy and adaptations."],
    ],
    checklist: ["Introduced role and gained consent", "Used active listening and appropriate non-verbal communication", "Kept the discussion person-centred", "Summarised and agreed next steps"],
    resource: ["/ward-simulation", "Open ward simulation"],
  },
  "task-2:reflect": {
    task: "Task 2", title: "Reflect and improve", minutes: 30, controlled: true,
    purpose: "Use notes and tutor feedback to evaluate performance and plan measurable improvement.",
    aos: ["AO2", "AO4", "AO5"], skills: ["SK12", "SK18"], pos: ["PO3", "PO4", "PO5"],
    fields: [
      ["tutor_feedback", "Tutor feedback received", "Record the specific feedback released after the role play."],
      ["reflection_strengths", "What went well", "Use examples and explain their impact on the individual and outcome."],
      ["reflection_improvements", "What could improve", "Analyse missed opportunities or less effective choices and their impact."],
      ["reflection_action_plan", "Action plan", "Set precise actions, support/resources, measures and review dates."],
    ],
    checklist: ["Reflection uses specific evidence", "Feedback is addressed", "Impact on the individual is explained", "Actions are measurable and realistic"],
  },
  "task-3:review-plan": {
    task: "Task 3", title: "Review the care plan and new evidence", minutes: 20, controlled: true,
    purpose: "Identify what has changed and what must be retained, amended or removed.",
    aos: ["AO2", "AO3"], skills: ["SK1", "SK2", "SK4", "SK9", "SK13"], pos: ["PO3", "PO4", "PO5", "PO6", "PO7"],
    fields: [
      ["change_summary", "New and changed information", "Summarise relevant evidence emerging from research and the interaction."],
      ["priority_review", "Needs, risks and priorities", "Identify current priorities and explain why their order has changed or remained the same."],
      ["plan_audit", "Existing-plan audit", "Record what to retain, amend or remove, with reasons."],
    ],
    checklist: ["New evidence is distinguished from existing information", "Risk and safeguarding are considered", "Preferences influence priorities", "Every proposed change is justified"],
    resource: ["/care-planning", "Open care-planning suite"],
  },
  "task-3:update-plan": {
    task: "Task 3", title: "Update needs, goals and interventions", minutes: 50, controlled: true,
    purpose: "Create a precise, safe and person-centred updated plan.",
    aos: ["AO2", "AO3", "AO4"], skills: ["SK3", "SK4", "SK5", "SK9", "SK17", "SK18"], pos: ["PO2", "PO3", "PO4", "PO5", "PO6"],
    fields: [
      ["updated_needs", "Assessed needs and risks", "Record evidence-based physical, psychological, social and communication needs."],
      ["updated_goals", "SMART goals", "Write specific, measurable, achievable, relevant and time-bound outcomes agreed with Amira."],
      ["updated_interventions", "Interventions and rationale", "State action, responsible person, frequency/timing, rationale and escalation threshold."],
      ["review_arrangements", "Monitoring and review", "Specify measures, review dates and what would trigger earlier reassessment."],
    ],
    checklist: ["Goals are genuinely measurable", "Responsibility and timescale are explicit", "Interventions connect to evidence", "Escalation and review are safe"],
    resource: ["/care-planning/shared", "Open shared care plan"],
  },
  "task-3:quality-check": {
    task: "Task 3", title: "Evaluate the updated care plan", minutes: 20, controlled: true,
    purpose: "Quality assure the plan against the brief, evidence, safety and the individual's wishes.",
    aos: ["AO2", "AO5"], skills: ["SK8", "SK12", "SK18"], pos: ["PO2", "PO3", "PO5", "PO7"],
    fields: [
      ["quality_review", "Safety and accuracy review", "Check consistency, omissions, terminology, calculations, confidentiality and escalation."],
      ["person_review", "Person-centred review", "Show how preferences, dignity, consent, independence and communication needs are represented."],
      ["fitness_review", "Fitness for purpose", "Judge how well the plan meets the employer brief and identify any remaining limitation."],
    ],
    checklist: ["No contradiction or unsafe omission remains", "Language is clear and professional", "The plan is individual rather than generic", "A reasoned final judgement is made"],
    resource: ["/care-planning/smart-goals", "Open SMART goals"],
  },
  "task-4:handover": {
    task: "Task 4", title: "Select and structure the handover", minutes: 45, controlled: true,
    purpose: "Prioritise the accumulated evidence into a clear, clinically useful handover.",
    aos: ["AO1", "AO2", "AO3"], skills: ["SK1", "SK6", "SK10", "SK13", "SK18"], pos: ["PO3", "PO4", "PO5"],
    fields: [
      ["sbar_situation", "S — Situation", "Identity, current situation, immediate concern and reason for handover."],
      ["sbar_background", "B — Background", "Only the history and context needed to understand the current position."],
      ["sbar_assessment", "A — Assessment", "Relevant observations, interpretation, risks, response and what you think is happening."],
      ["sbar_recommendation", "R — Recommendation", "Required action, owner, urgency, monitoring and confirmation of understanding."],
    ],
    checklist: ["Information is relevant and prioritised", "Assessment interprets rather than lists data", "Recommendation is explicit", "Confidentiality and accuracy are maintained"],
    resource: ["/care-planning/shared", "Open SBAR database"],
  },
  "task-4:present": {
    task: "Task 4", title: "Deliver the handover presentation", minutes: 60, controlled: true,
    purpose: "Prepare and rehearse a concise professional presentation grounded in the portfolio.",
    aos: ["AO2", "AO4"], skills: ["SK6", "SK10", "SK11", "SK14"], pos: ["PO1", "PO3", "PO4", "PO5"],
    fields: [
      ["presentation_structure", "Presentation structure", "Plan the opening, ordered main points, transitions, recommendation and close."],
      ["presentation_notes", "Speaker notes", "Use concise prompts rather than a full script; include the evidence behind key judgements."],
      ["delivery_review", "Rehearsal review", "Record duration, clarity, pace, terminology, audience awareness and changes made after rehearsal."],
    ],
    checklist: ["The opening states purpose and context", "Evidence supports each recommendation", "Slides/notes are readable and concise", "Delivery fits the time and audience"],
  },
  "task-4:questions": {
    task: "Task 4", title: "Respond to questions and review", minutes: 45, controlled: true,
    purpose: "Prepare for follow-up questions and evaluate the completed project against the original brief.",
    aos: ["AO2", "AO3", "AO5"], skills: ["SK10", "SK12", "SK13", "SK14"], pos: ["PO1", "PO4", "PO5"],
    scenario: "Question prompts: Which evidence most influenced your recommendations? What alternative did you reject and why? How did Amira's preferences change the plan? What would trigger escalation? What is the main limitation of your final outcome?",
    fields: [
      ["question_responses", "Responses to professional questions", "Answer each question using case evidence, justified reasoning and appropriate boundaries."],
      ["brief_evaluation", "Evaluation against the employer brief", "Judge how fully the final outcome meets the need, audience and constraints identified in Task 1."],
      ["final_review", "Final strengths, limitations and next steps", "Reach a balanced conclusion and identify improvements for future work."],
    ],
    checklist: ["Answers use evidence rather than assertion", "Alternative choices are considered", "Limitations are acknowledged", "The final judgement returns to the original brief"],
    resource: ["/performance", "Open performance dashboard"],
  },
};

function readEvidence(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

function Chip({ code, text, tone }) {
  const colours = tone === "ao" ? "border-amber-300 bg-amber-50 text-amber-900" : tone === "po" ? "border-violet-300 bg-violet-50 text-violet-900" : "border-cyan-300 bg-cyan-50 text-cyan-900";
  return <span title={text} className={`cursor-help rounded-lg border px-2 py-1 text-[10px] font-black ${colours}`}>{code}</span>;
}

function Timer({ minutes }) {
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [running, seconds]);
  const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
    <Clock3 className="h-4 w-4 text-violet-700" /><span className="font-mono text-sm font-black text-slate-900">{display}</span>
    <button onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause timer" : "Start timer"} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white">{running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
    <button onClick={() => { setRunning(false); setSeconds(minutes * 60); }} aria-label="Reset timer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><RotateCcw className="h-3.5 w-3.5" /></button>
  </div>;
}

export default function ESPWorkspace() {
  const { taskId, sectionId } = useParams();
  const navigate = useNavigate();
  const { portfolio, enterSection, updatePortfolio, setSectionComplete } = useESPCase();
  const key = `${taskId}:${sectionId}`;
  const module = MODULES[key];
  const stored = readEvidence(portfolio?.workspace_evidence);
  const [answers, setAnswers] = useState(stored[key] || {});
  const [checks, setChecks] = useState(stored[`${key}:checks`] || []);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (module) enterSection(taskId, sectionId); }, [taskId, sectionId]);
  useEffect(() => {
    const current = readEvidence(portfolio?.workspace_evidence);
    setAnswers(current[key] || {});
    setChecks(current[`${key}:checks`] || []);
  }, [key, portfolio?.id]);

  const completedCount = useMemo(() => Object.values(answers).filter((value) => value?.trim()).length, [answers]);
  if (!module) return <div className="clinical-page-shell"><p>ESP module not found.</p><button onClick={() => navigate("/esp-practice")}>Return to hub</button></div>;

  const save = async (complete = false) => {
    const latest = readEvidence(portfolio?.workspace_evidence);
    latest[key] = answers;
    latest[`${key}:checks`] = checks;
    const mirror = {};
    if (key === "task-1:research") mirror.research_notes = answers.research_notes || "";
    if (key === "task-1:report") mirror.research_report = Object.values(answers).join("\n\n");
    if (key === "task-2:roleplay") mirror.role_play_notes = answers.roleplay_notes || "";
    if (key === "task-2:reflect") {
      mirror.tutor_role_play_feedback = answers.tutor_feedback || "";
      mirror.reflective_account = [answers.reflection_strengths, answers.reflection_improvements, answers.reflection_action_plan].filter(Boolean).join("\n\n");
    }
    if (key === "task-4:handover") mirror.handover_plan = Object.values(answers).join("\n\n");
    if (key === "task-4:present") mirror.presentation_evidence = Object.values(answers).join("\n\n");
    if (key === "task-4:questions") mirror.question_responses = Object.values(answers).join("\n\n");
    await updatePortfolio({ workspace_evidence: JSON.stringify(latest), ...mirror });
    if (complete) {
      await setSectionComplete(key, true);
      navigate("/esp-practice");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  const toggleCheck = (index) => setChecks((value) => value.includes(index) ? value.filter((item) => item !== index) : [...value, index]);
  const ready = completedCount === module.fields.length && checks.length === module.checklist.length;

  return <main className="clinical-page-shell min-h-screen bg-slate-50 pb-32">
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate("/esp-practice")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft className="h-4 w-4" />ESP Practice Hub</button>
        <Timer minutes={module.minutes} />
      </div>

      <section className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{module.task} · {module.minutes} minute practice module</p><h1 className="mt-2 text-3xl font-black">{module.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{module.purpose}</p></div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${module.controlled ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200"}`}>{module.controlled ? <ShieldAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{module.controlled ? "Controlled practice · no AI/internet" : "Guided practice resources allowed"}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {module.aos.map((code) => <Chip key={code} code={code} text="Assessment objective" tone="ao" />)}
          {module.skills.map((code) => <Chip key={code} code={code} text={SK_CODES[code]} />)}
          {module.pos.map((code) => <Chip key={code} code={code} text={PERFORMANCE_OUTCOMES[code]} tone="po" />)}
        </div>
      </section>

      <div className="mt-5"><ESPCaseDossier taskId={taskId} /></div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {module.scenario && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><div className="flex gap-3"><UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /><div><p className="text-xs font-black uppercase tracking-wide text-violet-900">Practice stimulus</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-violet-950">{module.scenario}</p></div></div></div>}
          {module.fields.map(([field, label, prompt], index) => <article key={field} className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-xs font-black text-violet-800">{index + 1}</span><div><label htmlFor={field} className="font-black text-slate-950">{label}</label><p className="mt-1 text-xs leading-5 text-slate-600">{prompt}</p></div></div>
            <textarea id={field} value={answers[field] || ""} onChange={(event) => setAnswers((value) => ({ ...value, [field]: event.target.value }))} rows={7} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-900 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100" placeholder="Enter your evidence here…" />
            <p className="mt-1 text-right text-[10px] font-bold text-slate-400">{(answers[field] || "").trim().split(/\s+/).filter(Boolean).length} words</p>
          </article>)}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-emerald-700" /><h2 className="font-black text-slate-950">Quality checklist</h2></div>
            <div className="mt-4 space-y-2">{module.checklist.map((item, index) => <button key={item} onClick={() => toggleCheck(index)} className="flex w-full items-start gap-2 rounded-xl p-2 text-left hover:bg-slate-50"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${checks.includes(index) ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>{checks.includes(index) && <CheckCircle2 className="h-3.5 w-3.5" />}</span><span className="text-xs font-semibold leading-5 text-slate-700">{item}</span></button>)}</div>
          </section>

          <section className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><Target className="h-5 w-5 text-violet-700" /><h2 className="font-black text-slate-950">Completion evidence</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{completedCount}/{module.fields.length} evidence fields completed · {checks.length}/{module.checklist.length} checks confirmed.</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${Math.round(((completedCount + checks.length) / (module.fields.length + module.checklist.length)) * 100)}%` }} /></div>
          </section>

          {module.resource && <button onClick={() => navigate(module.resource[0])} className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-left text-sm font-black text-cyan-950 hover:bg-cyan-100"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{module.resource[1]}</span><ExternalLink className="h-4 w-4" /></button>}
        </aside>
      </div>

      <div className="sticky bottom-4 z-30 mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/90 bg-white/90 p-3 shadow-2xl backdrop-blur-xl">
        <button onClick={() => save(false)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Save className="h-4 w-4" />{saved ? "Saved to portfolio" : "Save progress"}</button>
        <button onClick={() => save(true)} disabled={!ready} className="inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><FileCheck2 className="h-4 w-4" />Complete section and return<ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  </main>;
}
