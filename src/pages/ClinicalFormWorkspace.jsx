import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import { getClinicalForm } from "@/lib/clinicalFormTemplates";
import { buildSimulationPrefill, loadCarePlanSimulation, localFormativeFeedback } from "@/lib/carePlanSimulation";
import { SKBadgeGroup } from "@/components/SKBadge";
import { ArrowLeft, Award, Calculator, CheckCircle2, ClipboardCheck, Info, Save, Send, ShieldAlert, Sparkles } from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-tl-purple/60 focus:ring-4 focus:ring-tl-purple/10";
const number = (value) => Number(value || 0);

function calculate(template, values) {
  switch (template.calculator) {
    case "bmi": {
      const bmi = number(values.height) > 0 ? number(values.weight) / (number(values.height) ** 2) : 0;
      return bmi ? { label: "Calculated BMI", value: bmi.toFixed(1), note: "Interpret alongside clinical context and an appropriate nutrition assessment." } : null;
    }
    case "risk": {
      const score = number(values.likelihood) * number(values.severity);
      const level = score >= 15 ? "High" : score >= 6 ? "Moderate" : score > 0 ? "Low" : "Not calculated";
      return score ? { label: "Initial risk score", value: score, note: `${level} — apply local risk thresholds and clinical judgement.`, urgent: score >= 15 } : null;
    }
    case "sum": {
      const total = Object.entries(values).filter(([key]) => key.startsWith("score")).reduce((sum, [, value]) => sum + number(value), 0);
      return total ? { label: "Recorded score total", value: total, note: "Confirm against the authorised assessment tool and apply clinical judgement." } : null;
    }
    case "gcs": {
      const total = number(values.eye) + number(values.verbal) + number(values.motor);
      return total ? { label: "GCS total", value: total, note: `E${values.eye || "–"} V${values.verbal || "–"} M${values.motor || "–"} — escalate any deterioration using local policy.`, urgent: total > 0 && total <= 8 } : null;
    }
    case "must": {
      const total = number(values.bmiScore) + number(values.weightLossScore) + number(values.acuteScore);
      return { label: "MUST total recorded", value: total, note: "Verify each component and risk category against the current authorised BAPEN MUST tool." };
    }
    case "fluid": {
      const input = ["oral", "enteral", "iv", "otherInput"].reduce((sum, key) => sum + number(values[key]), 0);
      const output = ["urine", "vomit", "drain", "otherOutput"].reduce((sum, key) => sum + number(values[key]), 0);
      const balance = number(values.carryForward) + input - output;
      return { label: "Running fluid balance", value: `${balance > 0 ? "+" : ""}${balance} ml`, note: `Input ${input} ml · Output ${output} ml · includes carry-forward balance.`, urgent: Math.abs(balance) >= 1000 };
    }
    default:
      return null;
  }
}

function Field({ field, value, onChange }) {
  const describedBy = `${field.id}-hint`;

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.id}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        required={field.required}
        placeholder="Enter clear, factual clinical information"
        className={inputClass}
        aria-describedby={field.hint ? describedBy : undefined}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select id={field.id} value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required} className={inputClass}>
        <option value="">Select an option</option>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {field.options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${active ? "border-tl-purple bg-tl-purple/10 text-tl-purple ring-2 ring-tl-purple/10" : "border-slate-200 bg-white text-slate-700 hover:border-tl-purple/35"}`}
            >
              <span className="mr-2">{active ? "✓" : "○"}</span>{option}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      id={field.id}
      type={field.type}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      required={field.required}
      min={field.min}
      max={field.max}
      step={field.step}
      className={inputClass}
    />
  );
}

function FeedbackPanel({ feedback, onReturnToWard }) {
  if (!feedback) return null;
  const labels = {
    completeness: "Completeness",
    clinicalReasoning: "Clinical reasoning",
    safetyEscalation: "Safety & escalation",
    personCentredCare: "Person-centred care",
    documentation: "Documentation",
  };

  return (
    <section className="mt-5 overflow-hidden rounded-[28px] border border-violet-200 bg-white/94 shadow-[0_20px_46px_rgba(66,55,88,0.14)]" aria-labelledby="feedback-heading">
      <div className="bg-gradient-to-r from-tl-purple to-violet-600 p-5 text-white sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-100">Instant formative feedback</p>
            <h2 id="feedback-heading" className="mt-1 text-xl font-black sm:text-2xl">{feedback.band}</h2>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-black shadow-inner">{Math.round(feedback.overallScore)}%</div>
        </div>
        <p className="mt-3 text-sm leading-6 text-violet-50">{feedback.summary}</p>
      </div>
      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-5">
          {Object.entries(feedback.categoryScores || {}).map(([key, score]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-lg font-black text-slate-950">{Math.round(score)}%</p>
              <p className="mt-0.5 text-[11px] font-bold leading-4 text-slate-600">{labels[key] || key}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-900"><CheckCircle2 className="h-4 w-4" /> What you did well</h3>
            <ul className="space-y-2">{feedback.strengths?.map((item) => <li key={item} className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-950">{item}</li>)}</ul>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-amber-900"><Award className="h-4 w-4" /> Areas to improve</h3>
            <ul className="space-y-2">{feedback.improvements?.map((item) => <li key={item} className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-950">{item}</li>)}</ul>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-black text-slate-950">Your next practice steps</h3>
          <ol className="space-y-2">{feedback.nextSteps?.map((item, index) => <li key={item} className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-sm leading-5 text-slate-800"><span className="font-black text-tl-purple">{index + 1}</span>{item}</li>)}</ol>
        </div>
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-semibold leading-5 text-sky-950">{feedback.safetyNote}</p>
        {onReturnToWard && <button onClick={onReturnToWard} className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800">Return to Ward Simulation</button>}
      </div>
    </section>
  );
}

export default function ClinicalFormWorkspace() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const template = getClinicalForm(toolId);
  const user = getCurrentUser();
  const storageKey = `clinical_form_${user?.id || "guest"}_${toolId}`;
  const simulation = loadCarePlanSimulation(toolId);
  const [values, setValues] = useState({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const prefilled = template ? buildSimulationPrefill(template, simulation) : {};
      setValues({ ...prefilled, ...saved });
    } catch {
      setValues({});
    }
  }, [navigate, storageKey]);

  const requiredFields = template?.fields.filter((field) => field.required) || [];
  const completeRequired = requiredFields.filter((field) => {
    const value = values[field.id];
    return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
  }).length;
  const completion = requiredFields.length ? Math.round((completeRequired / requiredFields.length) * 100) : 100;
  const result = useMemo(() => template ? calculate(template, values) : null, [template, values]);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-[24px] border border-white bg-white/90 p-8 text-center shadow-xl">
          <ShieldAlert className="mx-auto mb-3 h-9 w-9 text-tl-purple" />
          <h1 className="text-lg font-extrabold text-slate-950">Clinical tool not found</h1>
          <button onClick={() => navigate("/care-planning")} className="mt-4 rounded-xl bg-tl-purple px-4 py-2.5 text-sm font-bold text-white">Return to Care Planning</button>
        </div>
      </div>
    );
  }

  const update = (id, value) => {
    setValues((current) => ({ ...current, [id]: value }));
    setStatus("");
    setFeedback(null);
  };

  const save = async (submit) => {
    if (submit && completion < 100) {
      setStatus("Complete all required fields before submitting for review.");
      return;
    }

    setSaving(true);
    const generatedFeedback = submit ? localFormativeFeedback(template, values, simulation) : null;
    if (generatedFeedback) setFeedback(generatedFeedback);

    const payload = {
      student_id: user?.id || "local-user",
      student_name: user?.full_name || "Clinical Edge learner",
      type: toolId,
      title: `${template.title}${simulation?.patient?.name ? ` — ${simulation.patient.name}` : ""} — ${new Date().toLocaleDateString("en-GB")}`,
      content: JSON.stringify({ template: toolId, values, calculatedResult: result, source: template.source, simulationPatientId: simulation?.patient?.id, formativeFeedback: generatedFeedback }),
      linked_scenario: simulation?.patient?.id || undefined,
      status: submit ? "submitted" : "draft",
      tutor_feedback: generatedFeedback ? JSON.stringify(generatedFeedback) : undefined,
      sk_codes: template.skCodes,
      performance_outcomes: template.poCodes,
    };

    localStorage.setItem(storageKey, JSON.stringify(values));
    try {
      await base44.entities.CarePlanSubmission.create(payload);
      if (submit) localStorage.removeItem(storageKey);
      setStatus(submit ? "Submitted. Your formative feedback is ready below." : "Draft saved.");
    } catch {
      const drafts = JSON.parse(localStorage.getItem("careplan_drafts") || "[]");
      drafts.push({ ...payload, timestamp: Date.now() });
      localStorage.setItem("careplan_drafts", JSON.stringify(drafts));
      setStatus(submit ? "Submission stored on this device. Your formative feedback is ready below." : "Draft saved on this device.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(118,90,176,0.13),transparent_32%),radial-gradient(circle_at_top_right,rgba(39,181,168,0.10),transparent_28%)]">
      <header className="sticky top-0 z-20 border-b border-white/90 bg-white/85 shadow-[0_8px_24px_rgba(66,55,88,0.08)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/care-planning")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:text-tl-purple" aria-label="Back to Care Planning Suite">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tl-purple">Interactive clinical record</p>
            <h1 className="truncate text-base font-extrabold text-slate-950 sm:text-lg">{template.title}</h1>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700">{completion}% complete</span>
        </div>
        <div className="h-1 bg-slate-100"><div className="h-full bg-gradient-to-r from-tl-purple to-teal-500 transition-all duration-500" style={{ width: `${completion}%` }} /></div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6">
        {simulation?.patient && (
          <section className="mb-5 rounded-[24px] border border-tl-purple/25 bg-gradient-to-r from-violet-50/95 to-white p-5 shadow-[0_14px_32px_rgba(66,55,88,.11)]" aria-labelledby="simulation-patient-heading">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tl-purple text-white shadow-lg"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tl-purple">Ward-linked simulation · Bed {simulation.patient.bedDesignation}</p>
                <h2 id="simulation-patient-heading" className="mt-0.5 text-lg font-black text-slate-950">{simulation.patient.name}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">{simulation.briefing}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">Verified EHR facts have been pre-populated. You must complete the clinical assessment, judgement, actions and review.</p>
              </div>
            </div>
          </section>
        )}

        <section className="polished-glass-edge mb-5 rounded-[28px] border border-white/90 bg-white/88 p-5 shadow-[0_18px_42px_rgba(66,55,88,0.12),inset_0_1px_0_white] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">{template.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{template.description}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Adapted from supplied training template: {template.source}</p>
            </div>
            <SKBadgeGroup skCodes={template.skCodes} poCodes={template.poCodes} />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {template.pearson.map((outcome) => (
              <div key={outcome} className="flex items-start gap-2 rounded-xl border border-tl-purple/15 bg-tl-purple/7 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-800">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-tl-purple" /> {outcome}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-5 rounded-[22px] border border-sky-200/80 bg-sky-50/90 p-4 shadow-sm" aria-labelledby="guidance-title">
          <h2 id="guidance-title" className="mb-2 flex items-center gap-2 text-sm font-extrabold text-sky-950"><Info className="h-4 w-4" /> Clinical guidance</h2>
          <ul className="space-y-1.5">
            {template.guidance.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-sky-950"><span className="font-black text-sky-600">•</span>{item}</li>)}
          </ul>
        </section>

        {result && (
          <section className={`mb-5 rounded-[22px] border p-5 shadow-[0_12px_28px_rgba(66,55,88,0.09)] ${result.urgent ? "border-rose-300 bg-rose-50" : "border-teal-200 bg-teal-50"}`} aria-live="polite">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${result.urgent ? "bg-rose-600" : "bg-teal-600"}`}><Calculator className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{result.label}</p>
                <p className="text-2xl font-black text-slate-950">{result.value}</p>
                <p className="mt-1 text-sm leading-5 text-slate-700">{result.note}</p>
              </div>
            </div>
          </section>
        )}

        <form className="polished-glass-edge rounded-[28px] border border-white/90 bg-white/92 p-5 shadow-[0_20px_46px_rgba(66,55,88,0.13),inset_0_1px_0_white] backdrop-blur-xl sm:p-8" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-5 sm:grid-cols-2">
            {template.fields.map((field) => (
              <div key={field.id} className={field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.id} className="mb-2 block text-sm font-extrabold leading-5 text-slate-900">
                  {field.label}{field.required && <span className="ml-1 text-rose-600" aria-label="required">*</span>}
                </label>
                <Field field={field} value={values[field.id]} onChange={(value) => update(field.id, value)} />
              </div>
            ))}
          </div>
        </form>

        <FeedbackPanel feedback={feedback} onReturnToWard={simulation ? () => navigate("/ward-simulation") : null} />

        <div className="mt-5 rounded-[24px] border border-white/90 bg-white/82 p-3 shadow-xl backdrop-blur-xl">
          {status && (
            <div className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${status.startsWith("Complete") ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`} role="status">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {status}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => save(false)} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-tl-purple/30 bg-white px-5 py-3.5 text-sm font-extrabold text-tl-purple transition hover:bg-tl-purple/8 disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button type="button" onClick={() => save(true)} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-tl-purple to-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(118,90,176,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50">
              <Send className="h-4 w-4" /> {saving ? "Generating feedback…" : "Submit & Generate Feedback"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
