import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { RISK_ASSESSMENTS } from "@/lib/wardBoard";

const LEVELS = [
  { id: "low", label: "Low", colour: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { id: "moderate", label: "At risk", colour: "border-amber-300 bg-amber-50 text-amber-800" },
  { id: "high", label: "High", colour: "border-red-300 bg-red-50 text-red-800" },
];

export default function MandatoryIntakeRiskAssessment({ patient, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState("");
  const completedCount = Object.keys(answers).length;
  const canComplete = completedCount === RISK_ASSESSMENTS.length;
  const highestRisk = useMemo(() => {
    const values = Object.values(answers);
    if (values.includes("high")) return "high";
    if (values.includes("moderate")) return "moderate";
    return values.length ? "low" : null;
  }, [answers]);

  const complete = () => {
    if (!canComplete) return;
    onComplete?.({
      answers,
      notes: notes.trim(),
      highestRisk,
      completedAt: new Date().toISOString(),
      status: "complete",
      assessor: "Current clinical user",
    });
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="intake-risk-title">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/80 bg-slate-50 shadow-[0_30px_100px_-30px_rgba(15,23,42,.85)]">
        <div className="bg-gradient-to-r from-[#005eb8] to-sky-500 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 shadow-inner">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/75">Admission safety gate · Action required</p>
                <h2 id="intake-risk-title" className="mt-0.5 text-lg font-bold">Mandatory admission risk assessment</h2>
                <p className="mt-1 text-xs text-white/85">{patient.name} · NHS No. {patient.nhs_number} · Bed {patient.bed}</p>
              </div>
            </div>
            <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-bold">{completedCount}/{RISK_ASSESSMENTS.length}</span>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>All four admission screens must be recorded before this workflow can close. Select the current risk band based on the simulated assessment findings.</p>
          </div>

          <div className="space-y-3">
            {RISK_ASSESSMENTS.map((risk, index) => (
              <section key={risk.id} className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-100 text-xs font-bold text-[#005eb8]">{index + 1}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{risk.label}</h3>
                      <p className="text-[10px] text-slate-500">Required on admission · target within {risk.dueWithinHours}h</p>
                    </div>
                  </div>
                  {answers[risk.id] && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={`${risk.label} risk band`}>
                  {LEVELS.map((level) => {
                    const selected = answers[risk.id] === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setAnswers((current) => ({ ...current, [risk.id]: level.id }))}
                        aria-pressed={selected}
                        className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${selected ? `${level.colour} ring-2 ring-offset-1 ring-[#005eb8]` : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-300"}`}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-bold text-slate-700">Admission safety notes <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Record relevant controls, referrals or escalation actions…"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#005eb8] focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <div>
              <p className="text-xs font-bold text-slate-700">{canComplete ? "All mandatory screens recorded" : `${RISK_ASSESSMENTS.length - completedCount} assessment${RISK_ASSESSMENTS.length - completedCount === 1 ? "" : "s"} remaining`}</p>
              <p className="text-[10px] text-slate-500">Training simulation · follow local policy in clinical practice</p>
            </div>
            <button
              type="button"
              onClick={complete}
              disabled={!canComplete}
              className="flex items-center gap-2 rounded-xl bg-[#005eb8] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#004b93] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ClipboardCheck className="h-4 w-4" /> Complete admission assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
