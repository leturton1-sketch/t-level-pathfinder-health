import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowLeft, CheckCircle2, FileText, HeartPulse,
  Plus, Printer, Save, Search, ShieldAlert, Sparkles, UserRound, X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";

const emptyCheck = (user = {}) => ({
  clinic_name: "Dearne Valley College Health Hub",
  clinic_date: new Date().toISOString().slice(0, 10),
  clinician_name: user?.full_name || user?.username || "",
  clinician_designation: user?.designation || user?.role?.replace?.(/_/g, " ") || "",
  next_check_months: "",
  next_check_date: "",
  participant_reference: "",
  age: "",
  consent_confirmed: false,
  reason_for_check: "",
  height_cm: "",
  weight_kg: "",
  waist_cm: "",
  systolic_bp: "",
  diastolic_bp: "",
  pulse: "",
  respiratory_rate: "",
  spo2: "",
  temperature: "",
  smoking_status: "",
  alcohol_level: "",
  activity_minutes: "",
  fruit_veg_portions: "",
  sleep_quality: "",
  wellbeing_score: "",
  family_history: "",
  existing_conditions: "",
  current_medication: "",
  red_flag_symptoms: "",
  participant_goals: "",
});

const numberOrNull = (value) => value === "" ? null : Number(value);
const safeArray = (value) => {
  try { return JSON.parse(value || "[]"); } catch { return []; }
};

function calculateNextCheckDate(checkDate, months) {
  if (!checkDate || !months) return "";
  const date = new Date(`${checkDate}T12:00:00`);
  date.setMonth(date.getMonth() + Number(months));
  return date.toISOString().slice(0, 10);
}

function calculateBMI(heightCm, weightKg) {
  const heightM = Number(heightCm) / 100;
  if (!heightM || !Number(weightKg)) return null;
  return Math.round((Number(weightKg) / (heightM * heightM)) * 10) / 10;
}

function generateFeedback(check) {
  const strengths = [];
  const recommendations = [];
  const escalation = [];
  const learningPrompts = [];
  const bmi = calculateBMI(check.height_cm, check.weight_kg);
  const systolic = Number(check.systolic_bp);
  const diastolic = Number(check.diastolic_bp);
  const spo2 = Number(check.spo2);
  const temperature = Number(check.temperature);
  const wellbeing = Number(check.wellbeing_score);
  const activity = Number(check.activity_minutes);
  const portions = Number(check.fruit_veg_portions);
  const redFlags = check.red_flag_symptoms.trim();

  if (check.consent_confirmed) strengths.push("Consent was confirmed before the check and the record uses a clinic reference.");
  if (systolic && diastolic) strengths.push("A complete blood-pressure reading was recorded rather than a single value.");
  if (check.height_cm && check.weight_kg && check.waist_cm) strengths.push("Height, weight and waist measurements provide a broader view than BMI alone.");
  if (activity >= 150) strengths.push("The reported activity level meets the general NHS goal of at least 150 minutes of moderate activity each week.");
  if (portions >= 5) strengths.push("The reported fruit and vegetable intake meets the 5 A Day goal.");
  if (check.smoking_status === "never" || check.smoking_status === "former") strengths.push("No current smoking was reported.");
  if (wellbeing >= 7) strengths.push("The participant reported a positive current wellbeing score.");

  if (redFlags) escalation.push("Symptoms or immediate concerns were recorded. Stop the routine check and ask a qualified clinician to assess the participant using local escalation procedures.");
  if (systolic >= 180 || diastolic >= 120) escalation.push("The recorded blood pressure is in a severe range. Repeat the measurement correctly and seek urgent clinical review in line with local policy.");
  else if (systolic >= 140 || diastolic >= 90) recommendations.push("Repeat and document the blood-pressure measurement, then arrange review through the appropriate clinic, pharmacy or GP pathway.");
  if (spo2 && spo2 < 94) escalation.push("The oxygen-saturation reading needs prompt clinical review. Recheck the probe and participant, and consider any documented individual target range before escalating.");
  if (temperature && (temperature < 35 || temperature >= 38)) escalation.push("The temperature is outside the expected adult range. Recheck it and obtain clinical advice alongside symptoms and observations.");
  if (wellbeing !== 0 && wellbeing <= 4) recommendations.push("Offer a private wellbeing conversation, agree an appropriate support route and check whether there are any immediate safety concerns.");

  if (bmi) {
    if (bmi < 18.5) recommendations.push("Discuss nutrition and any unplanned weight loss sensitively; suggest GP or dietetic advice where appropriate.");
    if (bmi >= 25) recommendations.push("Use BMI only as one indicator. Explore achievable nutrition and activity goals, and signpost to NHS healthy-weight support if the participant wants help.");
  }
  if (check.smoking_status === "current") recommendations.push("Offer non-judgemental stop-smoking advice and signpost to a local stop-smoking service or pharmacy.");
  if (check.alcohol_level === "above_guideline" || check.alcohol_level === "unsure") recommendations.push("Explore alcohol intake using an approved screening approach and offer NHS alcohol-support information.");
  if (activity < 150) recommendations.push("Agree a realistic movement goal that builds gradually towards 150 minutes of moderate activity each week, adjusted for ability and clinical advice.");
  if (portions < 5) recommendations.push("Discuss one practical step towards a balanced diet and increasing fruit and vegetables towards 5 portions a day.");
  if (check.sleep_quality === "poor") recommendations.push("Explore sleep routine, duration and factors affecting sleep; signpost for clinical advice if poor sleep is persistent or significantly affects daily life.");
  if (check.participant_goals.trim()) strengths.push("A participant-led health goal was recorded, supporting shared decision-making.");

  learningPrompts.push("Explain which findings are objective observations and which are self-reported.");
  learningPrompts.push("Describe how you maintained consent, privacy, infection prevention and accurate equipment use.");
  learningPrompts.push("State what you would document, communicate and escalate, including the limits of your role.");
  if (!check.family_history.trim()) learningPrompts.push("Ask about relevant close-family history before considering longer-term cardiovascular risk.");
  if (!check.existing_conditions.trim() && !check.current_medication.trim()) learningPrompts.push("Confirm existing conditions, allergies and medicines before giving tailored advice.");

  if (!strengths.length) strengths.push("The check created a structured baseline that can be reviewed with a qualified practitioner.");
  if (!recommendations.length) recommendations.push("Maintain healthy routines and review the results with the participant, focusing on a small achievable goal.");
  if (!escalation.length) escalation.push("No automatic urgent trigger was identified from the entered values. Continue to use clinical judgement and local policy.");

  return {
    bmi,
    summary: escalation.some((item) => item.startsWith("Symptoms") || item.includes("urgent") || item.includes("prompt"))
      ? "Potential escalation identified — obtain qualified clinical review before routine lifestyle discussion."
      : "Health and wellbeing check complete — use the feedback to support a person-centred discussion and agreed next steps.",
    strengths,
    recommendations,
    escalation,
    learningPrompts,
  };
}

function Field({ label, required = false, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-4 text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-tl-purple focus:ring-2 focus:ring-tl-purple/15";

export default function HealthHub() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [tab, setTab] = useState("new");
  const [check, setCheck] = useState(() => emptyCheck(user));
  const [records, setRecords] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadRecords();
  }, [navigate]);

  const loadRecords = async () => {
    try {
      const result = await base44.entities.HealthHubRecord.list("-created_date", 100);
      setRecords(result || []);
    } catch {
      setRecords([]);
    }
  };

  const bmi = useMemo(() => calculateBMI(check.height_cm, check.weight_kg), [check.height_cm, check.weight_kg]);
  const set = (key) => (event) => {
    const value = event?.target?.type === "checkbox" ? event.target.checked : event.target.value;
    setCheck((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const requiredComplete = check.clinic_name.trim() && check.clinic_date
    && check.clinician_name.trim() && check.clinician_designation.trim() && check.participant_reference.trim()
    && check.consent_confirmed && check.systolic_bp && check.diastolic_bp && check.pulse
    && check.respiratory_rate && check.spo2 && check.temperature && check.height_cm && check.weight_kg
    && check.smoking_status && check.alcohol_level && check.activity_minutes !== ""
    && check.sleep_quality && check.wellbeing_score !== "";

  const submitCheck = async () => {
    if (!requiredComplete) {
      setMessage("Complete all required baseline observations, questions and consent before generating feedback.");
      return;
    }
    const result = generateFeedback(check);
    setFeedback(result);
    setSaving(true);
    try {
      await base44.entities.HealthHubRecord.create({
        clinic_name: check.clinic_name.trim(),
        clinic_date: check.clinic_date,
        recorded_at: new Date().toISOString(),
        recorded_by_id: user?.id || user?.username || "unknown",
        recorded_by_name: user?.full_name || user?.username || "Clinical user",
        participant_reference: check.participant_reference.trim(),
        age: numberOrNull(check.age),
        consent_confirmed: true,
        reason_for_check: check.reason_for_check,
        height_cm: numberOrNull(check.height_cm),
        weight_kg: numberOrNull(check.weight_kg),
        waist_cm: numberOrNull(check.waist_cm),
        bmi: result.bmi,
        systolic_bp: numberOrNull(check.systolic_bp),
        diastolic_bp: numberOrNull(check.diastolic_bp),
        pulse: numberOrNull(check.pulse),
        respiratory_rate: numberOrNull(check.respiratory_rate),
        spo2: numberOrNull(check.spo2),
        temperature: numberOrNull(check.temperature),
        smoking_status: check.smoking_status,
        alcohol_level: check.alcohol_level,
        activity_minutes: numberOrNull(check.activity_minutes),
        fruit_veg_portions: numberOrNull(check.fruit_veg_portions),
        sleep_quality: check.sleep_quality,
        wellbeing_score: numberOrNull(check.wellbeing_score),
        family_history: check.family_history,
        existing_conditions: check.existing_conditions,
        current_medication: check.current_medication,
        red_flag_symptoms: check.red_flag_symptoms,
        participant_goals: check.participant_goals,
        feedback_summary: result.summary,
        feedback_strengths: JSON.stringify(result.strengths),
        feedback_recommendations: JSON.stringify(result.recommendations),
        feedback_escalation: JSON.stringify(result.escalation),
        feedback_learning_prompts: JSON.stringify(result.learningPrompts),
        status: "completed",
      });
      setMessage("Health & Wellbeing Check saved and formative feedback generated.");
      loadRecords();
    } catch {
      setMessage("Feedback was generated, but the clinic record could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startNew = () => {
    setCheck(emptyCheck());
    setFeedback(null);
    setSelectedRecord(null);
    setMessage("");
    setTab("new");
  };

  const visibleRecords = records.filter((record) =>
    [record.participant_reference, record.clinic_name, record.recorded_by_name]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const viewRecord = (record) => {
    setSelectedRecord(record);
    setFeedback({
      bmi: record.bmi,
      summary: record.feedback_summary,
      strengths: safeArray(record.feedback_strengths),
      recommendations: safeArray(record.feedback_recommendations),
      escalation: safeArray(record.feedback_escalation),
      learningPrompts: safeArray(record.feedback_learning_prompts),
    });
  };

  return (
    <main className="clinical-page-shell min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(191,228,208,.38),transparent_30%),radial-gradient(circle_at_top_right,rgba(220,210,238,.45),transparent_30%)] text-slate-900">
      <header className="mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/90 bg-white/80 p-6 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-tl-purple" aria-label="Back to dashboard"><ArrowLeft className="h-5 w-5" /></button>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 text-white shadow-lg"><HeartPulse className="h-7 w-7" /></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700">Clinic recording and learning</p>
            <h1 className="text-2xl font-black">Health Hub</h1>
            <p className="text-sm text-slate-600">Record health-hub activity and complete a person-centred Health & Wellbeing Check.</p>
          </div>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-tl-purple px-4 py-3 text-sm font-bold text-white shadow-md hover:opacity-90"><Plus className="h-4 w-4" /> New check</button>
      </header>

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/90 bg-white/70 p-2 shadow-sm backdrop-blur-xl" role="tablist">
          <button onClick={() => setTab("new")} className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === "new" ? "bg-white text-tl-purple shadow" : "text-slate-600"}`}><HeartPulse className="mr-2 inline h-4 w-4" />Health & Wellbeing Check</button>
          <button onClick={() => setTab("records")} className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === "records" ? "bg-white text-tl-purple shadow" : "text-slate-600"}`}><FileText className="mr-2 inline h-4 w-4" />Clinic records ({records.length})</button>
        </div>

        {tab === "new" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              <section className="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-lg backdrop-blur-xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><UserRound className="h-5 w-5 text-tl-purple" />Clinic details and consent</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Clinic or health hub" required><input className={inputClass} value={check.clinic_name} onChange={set("clinic_name")} /></Field>
                  <Field label="Date" required><input type="date" className={inputClass} value={check.clinic_date} onChange={set("clinic_date")} /></Field>
                  <Field label="Participant reference or initials" required hint="Use the minimum identifying information needed for this training record."><input className={inputClass} value={check.participant_reference} onChange={set("participant_reference")} /></Field>
                  <Field label="Age"><input type="number" min="16" max="120" className={inputClass} value={check.age} onChange={set("age")} /></Field>
                  <div className="sm:col-span-2"><Field label="Reason for check"><textarea rows="2" className={inputClass} value={check.reason_for_check} onChange={set("reason_for_check")} /></Field></div>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-700" checked={check.consent_confirmed} onChange={set("consent_confirmed")} />
                  <span><strong>Consent confirmed.</strong> The participant understands the purpose of the check, how information will be recorded and that they may decline any part.</span>
                </label>
              </section>

              <section className="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-lg backdrop-blur-xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><HeartPulse className="h-5 w-5 text-rose-600" />Baseline observations</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Systolic BP (mmHg)" required><input type="number" className={inputClass} value={check.systolic_bp} onChange={set("systolic_bp")} /></Field>
                  <Field label="Diastolic BP (mmHg)" required><input type="number" className={inputClass} value={check.diastolic_bp} onChange={set("diastolic_bp")} /></Field>
                  <Field label="Pulse (bpm)" required><input type="number" className={inputClass} value={check.pulse} onChange={set("pulse")} /></Field>
                  <Field label="Respiratory rate" required><input type="number" className={inputClass} value={check.respiratory_rate} onChange={set("respiratory_rate")} /></Field>
                  <Field label="SpO₂ (%)" required><input type="number" min="50" max="100" className={inputClass} value={check.spo2} onChange={set("spo2")} /></Field>
                  <Field label="Temperature (°C)" required><input type="number" step="0.1" className={inputClass} value={check.temperature} onChange={set("temperature")} /></Field>
                  <Field label="Height (cm)" required><input type="number" className={inputClass} value={check.height_cm} onChange={set("height_cm")} /></Field>
                  <Field label="Weight (kg)" required><input type="number" step="0.1" className={inputClass} value={check.weight_kg} onChange={set("weight_kg")} /></Field>
                  <Field label="Waist (cm)"><input type="number" step="0.1" className={inputClass} value={check.waist_cm} onChange={set("waist_cm")} /></Field>
                </div>
                <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm"><strong>Calculated BMI:</strong> {bmi || "Enter height and weight"} <span className="text-xs text-slate-600">— one indicator only; it does not distinguish muscle from fat.</span></div>
              </section>

              <section className="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-lg backdrop-blur-xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Activity className="h-5 w-5 text-emerald-700" />Health and lifestyle questions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Smoking status" required><select className={inputClass} value={check.smoking_status} onChange={set("smoking_status")}><option value="">Select</option><option value="never">Never smoked</option><option value="former">Former smoker</option><option value="current">Current smoker</option><option value="prefer_not_to_say">Prefer not to say</option></select></Field>
                  <Field label="Alcohol intake" required><select className={inputClass} value={check.alcohol_level} onChange={set("alcohol_level")}><option value="">Select</option><option value="none">None</option><option value="within_guideline">Within guideline</option><option value="above_guideline">Above guideline</option><option value="unsure">Unsure</option><option value="prefer_not_to_say">Prefer not to say</option></select></Field>
                  <Field label="Moderate activity (minutes/week)" required><input type="number" min="0" className={inputClass} value={check.activity_minutes} onChange={set("activity_minutes")} /></Field>
                  <Field label="Fruit and vegetable portions/day"><input type="number" min="0" max="20" className={inputClass} value={check.fruit_veg_portions} onChange={set("fruit_veg_portions")} /></Field>
                  <Field label="Sleep quality" required><select className={inputClass} value={check.sleep_quality} onChange={set("sleep_quality")}><option value="">Select</option><option value="good">Good</option><option value="variable">Variable</option><option value="poor">Poor</option><option value="prefer_not_to_say">Prefer not to say</option></select></Field>
                  <Field label="Current wellbeing (0–10)" required><input type="number" min="0" max="10" className={inputClass} value={check.wellbeing_score} onChange={set("wellbeing_score")} /></Field>
                  <Field label="Relevant family history"><textarea rows="3" className={inputClass} value={check.family_history} onChange={set("family_history")} /></Field>
                  <Field label="Existing conditions"><textarea rows="3" className={inputClass} value={check.existing_conditions} onChange={set("existing_conditions")} /></Field>
                  <Field label="Current medicines"><textarea rows="3" className={inputClass} value={check.current_medication} onChange={set("current_medication")} /></Field>
                  <Field label="Participant’s health goal"><textarea rows="3" className={inputClass} value={check.participant_goals} onChange={set("participant_goals")} /></Field>
                  <div className="sm:col-span-2"><Field label="Symptoms or immediate concerns" hint="If present, pause the routine check and follow local escalation procedures."><textarea rows="3" className={inputClass} value={check.red_flag_symptoms} onChange={set("red_flag_symptoms")} /></Field></div>
                </div>
              </section>

              {message && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold text-violet-950" role="status">{message}</div>}
              <button onClick={submitCheck} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-tl-purple to-violet-700 px-6 py-4 text-sm font-black text-white shadow-lg disabled:opacity-50"><Sparkles className="h-5 w-5" />{saving ? "Saving…" : "Save check and generate formative feedback"}</button>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[28px] border border-white/90 bg-slate-900 p-6 text-white shadow-xl">
                <ShieldAlert className="h-6 w-6 text-amber-300" />
                <h2 className="mt-4 text-lg font-black">Safe use</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">This learning tool supports documentation and formative discussion. It does not diagnose illness or replace a qualified clinician, validated risk calculator or local pathway.</p>
              </div>
              {feedback && <FeedbackSheet feedback={feedback} reference={check.participant_reference} onPrint={() => window.print()} />}
            </aside>
          </div>
        ) : (
          <section className="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-xl font-black">Stored clinic records</h2><p className="text-sm text-slate-600">Review completed Health & Wellbeing Checks and formative feedback.</p></div>
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm" placeholder="Search records" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleRecords.map((record) => (
                <button key={record.id} onClick={() => viewRecord(record)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-tl-purple/30 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black">{record.participant_reference}</p><p className="text-xs text-slate-500">{record.clinic_name}</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                  <div className="mt-4 flex justify-between text-xs text-slate-600"><span>{record.clinic_date}</span><span>BP {record.systolic_bp}/{record.diastolic_bp}</span><span>BMI {record.bmi || "—"}</span></div>
                </button>
              ))}
              {!visibleRecords.length && <p className="col-span-full py-12 text-center text-sm text-slate-500">No matching Health Hub records.</p>}
            </div>
            {selectedRecord && <div className="mt-6"><FeedbackSheet feedback={feedback} reference={selectedRecord.participant_reference} onClose={() => { setSelectedRecord(null); setFeedback(null); }} onPrint={() => window.print()} /></div>}
          </section>
        )}

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white/75 p-4 text-xs leading-5 text-slate-600">
          Content is informed by the NHS Health Check, NHS blood-pressure testing and NHS healthy-weight guidance. Use approved local documentation and escalation policies in real clinics.
          <span className="ml-2"><a className="font-bold text-tl-purple underline" href="https://www.nhs.uk/tests-and-treatments/nhs-health-check/" target="_blank" rel="noreferrer">NHS Health Check</a> · <a className="font-bold text-tl-purple underline" href="https://www.nhs.uk/tests-and-treatments/blood-pressure-test/" target="_blank" rel="noreferrer">Blood pressure</a> · <a className="font-bold text-tl-purple underline" href="https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults" target="_blank" rel="noreferrer">BMI</a></span>
        </footer>
      </div>
    </main>
  );
}

function FeedbackSheet({ feedback, reference, onClose, onPrint }) {
  return (
    <section className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-xl" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-tl-purple">Formative feedback sheet</p><h2 className="text-lg font-black">{reference || "Health & Wellbeing Check"}</h2></div>
        <div className="flex gap-2">{onPrint && <button onClick={onPrint} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Print feedback"><Printer className="h-4 w-4" /></button>}{onClose && <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Close feedback"><X className="h-4 w-4" /></button>}</div>
      </div>
      <p className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-950">{feedback.summary}</p>
      <FeedbackList title="What was done well" icon={CheckCircle2} tone="text-emerald-700" items={feedback.strengths} />
      <FeedbackList title="Recommendations and advice" icon={Sparkles} tone="text-violet-700" items={feedback.recommendations} />
      <FeedbackList title="Review and escalation" icon={ShieldAlert} tone="text-rose-700" items={feedback.escalation} />
      <FeedbackList title="Learner reflection prompts" icon={Save} tone="text-sky-700" items={feedback.learningPrompts} />
    </section>
  );
}

function FeedbackList({ title, icon: Icon, tone, items }) {
  return (
    <div className="mt-6">
      <h3 className={`mb-2 flex items-center gap-2 text-sm font-black ${tone}`}><Icon className="h-4 w-4" />{title}</h3>
      <ul className="space-y-2">{(items || []).map((item) => <li key={item} className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">{item}</li>)}</ul>
    </div>
  );
}