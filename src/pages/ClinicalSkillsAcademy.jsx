import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowLeft, BookOpenCheck, Brain, BriefcaseMedical, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, FileHeart, FlaskConical, GraduationCap, HandHeart, HeartPulse,
  Microscope, Search, ShieldCheck, Sparkles, Stethoscope, Syringe, Target, UsersRound,
} from "lucide-react";
import TLevelLogo from "@/components/TLevelLogo";

const PATHWAYS = [
  {
    id: "assessment",
    label: "Assessment & clinical skills",
    short: "Clinical skills",
    description: "Practise safe assessment, observations, documentation and escalation.",
    icon: Stethoscope,
    tone: "from-cyan-400 to-sky-700",
    modules: [
      { id: "admission", title: "Virtual Patient Admission", detail: "Interview, identify, consent and record a complete admission.", icon: FileHeart, route: "/health-hub", duration: "35 min", spec: "ANS1.1" },
      { id: "news2", title: "Clinical Observations & NEWS2", detail: "Record observations, calculate NEWS2 and escalate deterioration.", icon: Activity, route: "/care-planning/news2", duration: "30 min", spec: "ANS1.1" },
      { id: "risk", title: "Risk Assessment Clinic", detail: "Complete BMI, MUST, Braden, Waterlow, falls and mobility tools.", icon: ClipboardCheck, route: "/care-planning", duration: "45 min", spec: "ANS1.1" },
      { id: "infection", title: "Infection Prevention Lab", detail: "Select PPE, sequence safe practice and identify contamination.", icon: FlaskConical, route: "/knowledge-library", duration: "25 min", spec: "Core 2 & 4" },
    ],
  },
  {
    id: "person-centred",
    label: "Person-centred care",
    short: "Person-centred",
    description: "Support individual needs while maintaining dignity, choice and independence.",
    icon: HandHeart,
    tone: "from-emerald-400 to-teal-700",
    modules: [
      { id: "adl", title: "Activities of Daily Living Ward", detail: "Respond to call bells involving nutrition, mobility and personal care.", icon: HeartPulse, route: "/ward-simulation", duration: "40 min", spec: "ANS2.1" },
      { id: "communication", title: "Communication Studio", detail: "Adapt communication to individual needs and clinical situations.", icon: UsersRound, route: "/ward-simulation", duration: "30 min", spec: "Core 5" },
      { id: "safeguarding", title: "Safeguarding Decision Room", detail: "Recognise concerns, respond to disclosures and follow reporting pathways.", icon: ShieldCheck, route: "/theory", duration: "35 min", spec: "Core 7" },
      { id: "wellbeing", title: "Health & Wellbeing Clinic", detail: "Complete baseline checks and create person-centred recommendations.", icon: BriefcaseMedical, route: "/health-hub", duration: "35 min", spec: "Core 6" },
    ],
  },
  {
    id: "reasoning",
    label: "Clinical reasoning",
    short: "Reasoning",
    description: "Connect science, patient information and professional decisions.",
    icon: Brain,
    tone: "from-violet-400 to-fuchsia-700",
    modules: [
      { id: "anatomy", title: "Anatomy to Deterioration Lab", detail: "Explore body systems and connect altered physiology to clinical signs.", icon: Microscope, route: "/anatomy-physiology", duration: "45 min", spec: "Core 8–9" },
      { id: "deterioration", title: "Deteriorating Patient Challenge", detail: "Recognise changing observations, prioritise and escalate safely.", icon: Activity, route: "/ward-simulation", duration: "30 min", spec: "ANS1.1" },
      { id: "sbar", title: "SBAR Handover Simulator", detail: "Select relevant evidence and deliver a structured clinical handover.", icon: Stethoscope, route: "/ward-simulation", duration: "25 min", spec: "ESP T4" },
      { id: "medicines", title: "Medicines Safety Room", detail: "Check identity, allergies, prescriptions and documentation.", icon: Syringe, route: "/knowledge-library", duration: "30 min", spec: "Clinical practice" },
    ],
  },
  {
    id: "assessment-prep",
    label: "Assessment preparation",
    short: "Assessment prep",
    description: "Rehearse synoptic tasks and build evidence of improving performance.",
    icon: GraduationCap,
    tone: "from-amber-300 to-orange-600",
    modules: [
      { id: "esp", title: "ESP Practice Journey", detail: "Follow one patient through research, interaction, care planning and handover.", icon: Target, route: "/interactive-learning", duration: "90 min", spec: "ESP T1–T4" },
      { id: "adult-nursing", title: "Adult Nursing Scenarios", detail: "Practise delegated care, documentation and professional discussion.", icon: HeartPulse, route: "/ward-simulation", duration: "60 min", spec: "PO1–PO3" },
      { id: "unseen", title: "Timed Unseen Cases", detail: "Apply knowledge to unfamiliar clinical information under time pressure.", icon: Clock3, route: "/interactive-learning", duration: "45 min", spec: "AO2–AO3" },
      { id: "portfolio", title: "Clinical Skills Passport", detail: "Review attempts, feedback, evidence and areas for development.", icon: BookOpenCheck, route: "/performance", duration: "Ongoing", spec: "Progress record" },
    ],
  },
];

export default function ClinicalSkillsAcademy() {
  const navigate = useNavigate();
  const [activePathway, setActivePathway] = useState(() => {
    const focus = new URLSearchParams(window.location.search).get("pathway");
    return focus || "all";
  });
  const [query, setQuery] = useState("");

  const visiblePathways = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    return PATHWAYS
      .filter((pathway) => activePathway === "all" || pathway.id === activePathway)
      .map((pathway) => ({
        ...pathway,
        modules: pathway.modules.filter((module) => (
          !normalised
          || module.title.toLowerCase().includes(normalised)
          || module.detail.toLowerCase().includes(normalised)
          || module.spec.toLowerCase().includes(normalised)
        )),
      }))
      .filter((pathway) => pathway.modules.length);
  }, [activePathway, query]);

  const moduleCount = PATHWAYS.reduce((total, pathway) => total + pathway.modules.length, 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,.98),transparent_29%),radial-gradient(circle_at_85%_18%,rgba(220,210,238,.58),transparent_32%),linear-gradient(145deg,#faf9fb_0%,#f2eef7_48%,#f8f6fa_100%)] pb-16 text-[#15131A]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.38)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.38)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="polished-glass-edge relative mb-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[26px] border border-white/85 bg-gradient-to-br from-slate-100/88 via-slate-200/68 to-slate-300/50 px-5 py-4 shadow-[0_10px_0_-5px_rgba(100,116,139,.30),0_24px_55px_-30px_rgba(15,23,42,.65),inset_1px_1px_1px_white] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/")} className="no-clay grid h-11 w-11 place-items-center rounded-2xl border border-white/90 bg-white/80 text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:text-violet-700" aria-label="Return to Clinical Command Centre">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-700 text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-violet-700">Pathfinder Health · Practical learning</p>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Clinical Skills Academy</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50/85 px-3 py-1.5 text-[10px] font-bold text-emerald-800 sm:flex sm:items-center sm:gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Practical pathways ready
            </span>
            <TLevelLogo size="sm" />
          </div>
        </header>

        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
          <article className="polished-glass-edge relative overflow-hidden rounded-[28px] border border-white/90 bg-gradient-to-br from-slate-100/90 via-slate-200/72 to-slate-300/55 p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,.65),inset_1px_1px_1px_white] backdrop-blur-3xl">
            <div className="absolute right-[-35px] top-[-45px] h-48 w-48 rounded-full bg-violet-400/15 blur-2xl" />
            <p className="relative text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Learn by doing</p>
            <h2 className="relative mt-2 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Practise complete patient journeys, not isolated facts.</h2>
            <p className="relative mt-3 max-w-3xl text-sm font-medium leading-6 text-[#4A5568]">
              Move from assessment to action, documentation, escalation and reflection using the connected Pathfinder Health workspaces.
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white">{moduleCount} practical modules</span>
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-slate-700">4 learning pathways</span>
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-slate-700">Specification mapped</span>
            </div>
          </article>

          <aside className="rounded-[28px] bg-slate-900/90 p-5 text-white shadow-[0_22px_45px_-28px_rgba(15,23,42,.8)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-cyan-300"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[.16em]">Recommended journey</span></div>
            <p className="mt-3 text-lg font-black">Admission to handover</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Start with a patient admission, record observations, assess risks, update the care plan and complete SBAR.</p>
            <button type="button" onClick={() => navigate("/health-hub")} className="no-clay mt-5 flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-700 px-4 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5">
              Begin connected practice <ChevronRight className="h-4 w-4" />
            </button>
          </aside>
        </section>

        <section className="mb-5 rounded-[24px] border border-white/90 bg-white/70 p-3 shadow-[0_14px_35px_-28px_rgba(15,23,42,.65)] backdrop-blur-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" aria-label="Filter learning pathways">
              <button type="button" onClick={() => setActivePathway("all")} className={`no-clay rounded-xl px-3 py-2 text-[10px] font-black transition ${activePathway === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-violet-50"}`}>All pathways</button>
              {PATHWAYS.map((pathway) => (
                <button key={pathway.id} type="button" onClick={() => setActivePathway(pathway.id)} className={`no-clay rounded-xl px-3 py-2 text-[10px] font-black transition ${activePathway === pathway.id ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-violet-50"}`}>
                  {pathway.short}
                </button>
              ))}
            </div>
            <label className="relative block min-w-[250px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules or specification…" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200" />
            </label>
          </div>
        </section>

        <div className="space-y-5">
          {visiblePathways.map((pathway) => {
            const PathwayIcon = pathway.icon;
            return (
              <section key={pathway.id} className="polished-glass-edge rounded-[28px] border border-white/90 bg-gradient-to-br from-slate-100/88 via-slate-200/68 to-slate-300/48 p-4 shadow-[0_18px_42px_-30px_rgba(15,23,42,.65),inset_1px_1px_1px_white] backdrop-blur-3xl sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${pathway.tone} text-white shadow-lg`}><PathwayIcon className="h-6 w-6" /></span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{pathway.label}</h2>
                    <p className="mt-0.5 text-xs font-medium text-[#4A5568]">{pathway.description}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  {pathway.modules.map((module) => {
                    const ModuleIcon = module.icon;
                    return (
                      <button key={module.id} type="button" onClick={() => navigate(module.route)} className="no-clay group flex min-h-[190px] flex-col rounded-[22px] border border-white/95 bg-white/82 p-4 text-left shadow-[0_8px_0_-5px_rgba(100,116,139,.28),0_18px_30px_-24px_rgba(15,23,42,.68)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_0_-6px_rgba(100,116,139,.30),0_26px_38px_-22px_rgba(15,23,42,.72)] focus:outline-none focus:ring-2 focus:ring-violet-500">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${pathway.tone} text-white shadow-md`}><ModuleIcon className="h-5 w-5" /></span>
                          <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-800">{module.spec}</span>
                        </div>
                        <h3 className="mt-4 text-sm font-black leading-5 text-slate-900">{module.title}</h3>
                        <p className="mt-1.5 flex-1 text-[11px] font-medium leading-5 text-[#4A5568]">{module.detail}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500"><Clock3 className="h-3 w-3" /> {module.duration}</span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-violet-700">Open practice <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {!visiblePathways.length && (
          <div className="rounded-[28px] border border-white/90 bg-white/80 px-6 py-14 text-center shadow-xl backdrop-blur-2xl">
            <Search className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-lg font-black text-slate-900">No matching modules</h2>
            <p className="mt-1 text-sm text-[#4A5568]">Try a different title, pathway or specification reference.</p>
          </div>
        )}
      </div>
    </main>
  );
}