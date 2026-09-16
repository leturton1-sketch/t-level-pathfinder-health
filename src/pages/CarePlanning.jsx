import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { SKBadgeGroup } from "@/components/SKBadge";
import { CLINICAL_FORM_CATEGORIES, getClinicalForms } from "@/lib/clinicalFormTemplates";
import {
  Activity, BookHeart, Brain, ChevronRight, ClipboardList, Droplets, FileHeart,
  HeartPulse, Pill, Search, Sparkles, Stethoscope, Target, Users,
} from "lucide-react";

const FEATURED_TOOLS = [
  { id: "shared", title: "Shared Care Plan Workspace", icon: Sparkles, description: "Build and evaluate a person-centred plan with SMART goals, clinical target prompts and SBAR communication.", skCodes: ["SK3", "SK6", "SK9"], poCodes: ["PO4", "PO5", "PO9"], to: "/care-planning/shared", tone: "from-teal-500 to-emerald-600" },
  { id: "abcde", title: "ABCDE Assessment", icon: Stethoscope, description: "Complete a systematic assessment and escalate deterioration.", skCodes: ["SK2", "SK17"], poCodes: ["PO4", "PO9"], to: "/care-planning/abcde", tone: "from-sky-500 to-cyan-600" },
  { id: "news2", title: "NEWS2 Scoring", icon: HeartPulse, description: "Record physiological observations with automatic scoring and escalation guidance.", skCodes: ["SK1", "SK17"], poCodes: ["PO4", "PO9"], to: "/care-planning/news2", tone: "from-rose-500 to-red-600" },
  { id: "smart", title: "SMART Goals", icon: Target, description: "Create measurable, person-centred goals and review outcomes.", skCodes: ["SK3", "SK9"], poCodes: ["PO6", "PO9"], to: "/care-planning/smart-goals", tone: "from-tl-blue to-sky-600" },
];

const categoryIcons = {
  assessment: ClipboardList,
  risk: Activity,
  nutrition: Droplets,
  skin: FileHeart,
  neurology: Brain,
  medicines: Pill,
  communication: Users,
};

export default function CarePlanning() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const forms = useMemo(() => getClinicalForms(), []);

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const filtered = forms.filter((form) => {
    const matchesCategory = category === "all" || form.category === category;
    const haystack = `${form.title} ${form.description} ${form.source}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });

  return (
    <div className="clinical-page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(118,90,176,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(39,181,168,0.10),transparent_28%)]">
      <main className="mx-auto max-w-6xl">
        <section className="polished-glass-edge mb-6 overflow-hidden rounded-[30px] border border-white/90 bg-white/86 p-6 shadow-[0_22px_50px_rgba(66,55,88,0.14),inset_0_1px_0_white] backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tl-blue to-sky-600 text-white shadow-[0_14px_28px_rgba(118,90,176,0.3),inset_0_1px_0_rgba(255,255,255,.35)]">
              <BookHeart className="h-7 w-7" />
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-tl-blue">T Level Health clinical toolkit</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Care Planning Suite</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
                Person-centred assessments, clinical records and review tools adapted from the supplied RNN Group paper templates and mapped to Pearson occupational performance outcomes.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["27", "interactive records"],
              ["Auto", "calculations and totals"],
              ["Draft", "save and tutor review"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white bg-white/75 px-4 py-3 shadow-[0_8px_18px_rgba(66,55,88,.08),inset_0_1px_0_white]">
                <p className="text-lg font-black text-tl-blue">{value}</p><p className="text-xs font-semibold text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8" aria-labelledby="core-tools-title">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-tl-blue">Core workspaces</p>
              <h2 id="core-tools-title" className="text-xl font-black text-slate-950">Assessment and care planning</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURED_TOOLS.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => navigate(tool.to)}
                className="group polished-glass-edge animate-slide-up rounded-[26px] border border-white/90 bg-white/88 p-6 text-left shadow-[0_14px_32px_rgba(66,55,88,.11),inset_0_1px_0_white] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(66,55,88,.17),inset_0_1px_0_white] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/20"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.tone} text-white shadow-lg`}><tool.icon className="h-6 w-6" /></div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition group-hover:bg-tl-blue group-hover:text-white"><ChevronRight className="h-5 w-5" /></span>
                </div>
                <h3 className="text-lg font-black text-slate-950">{tool.title}</h3>
                <p className="mb-4 mt-1 text-sm leading-6 text-slate-700">{tool.description}</p>
                <SKBadgeGroup skCodes={tool.skCodes} poCodes={tool.poCodes} />
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="records-title">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-tl-blue">Clinical documentation library</p>
            <h2 id="records-title" className="text-xl font-black text-slate-950">Interactive clinical records</h2>
            <p className="mt-1 text-sm text-slate-700">Choose a record, complete its guided fields, review calculations and submit evidence.</p>
          </div>

          <div className="mb-6 rounded-[24px] border border-white/90 bg-white/82 p-4 shadow-[0_12px_28px_rgba(66,55,88,.1)] backdrop-blur-xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <span className="sr-only">Search clinical records</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assessments, charts and records…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-tl-blue/50 focus:ring-4 focus:ring-tl-blue/10" />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter records by category">
              <button onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${category === "all" ? "bg-tl-blue text-white" : "border border-slate-200 bg-white text-slate-700"}`}>All records</button>
              {CLINICAL_FORM_CATEGORIES.map((item) => (
                <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${category === item.id ? "bg-tl-blue text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{item.label}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((form, index) => {
              const Icon = categoryIcons[form.category] || ClipboardList;
              return (
                <button
                  key={form.id}
                  onClick={() => navigate(`/care-planning/tool/${form.id}`)}
                  className="group polished-glass-edge animate-slide-up rounded-[24px] border border-white/90 bg-white/88 p-6 text-left shadow-[0_12px_28px_rgba(66,55,88,.1),inset_0_1px_0_white] transition-all duration-300 hover:-translate-y-1 hover:border-tl-blue/30 hover:shadow-[0_18px_38px_rgba(66,55,88,.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/20"
                  style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-white text-tl-blue shadow-[0_8px_18px_rgba(118,90,176,.16),inset_0_1px_0_white]"><Icon className="h-5 w-5" /></div>
                    <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-tl-blue" />
                  </div>
                  <h3 className="text-base font-black text-slate-950">{form.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-700">{form.description}</p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Source: {form.source}</p>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-[24px] border border-white bg-white/85 p-8 text-center text-sm font-semibold text-slate-700 shadow-lg">No clinical records match this search.</div>
          )}
        </section>
      </main>
    </div>
  );
}
