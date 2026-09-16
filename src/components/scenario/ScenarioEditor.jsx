import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { ADL_TASKS } from "@/lib/adlScenario";
import { SKBadgeGroup } from "@/components/SKBadge";
import { WARD_PATIENTS } from "@/lib/wardPatients";
import { SBAR_PATIENTS } from "@/lib/sbarDatabase";
import { getCurrentUser } from "@/lib/clinicalAuth";
import DecisionTreeEditor from "@/components/scenario/DecisionTreeEditor";
import {
  User, Heart, Activity, Thermometer, Wind, Droplet, Brain, Save,
  X, Sparkles, Copy, AlertCircle, FileText, ChevronRight, ChevronDown,
} from "lucide-react";

const DIFFICULTIES = [
  { value: "guided", label: "Guided" },
  { value: "intermediate", label: "Intermediate" },
  { value: "independent", label: "Independent" },
];

const CATEGORIES = [
  { value: "deterioration", label: "Deterioration" },
  { value: "infection_control", label: "Infection Control" },
  { value: "fluid_management", label: "Fluid Management" },
  { value: "falls_risk", label: "Falls Risk" },
  { value: "post_op", label: "Post-Op" },
  { value: "admission", label: "Admission" },
  { value: "discharge", label: "Discharge" },
  { value: "activities_daily_living", label: "Activities of Daily Living" },
];

const AVPU_OPTIONS = ["A", "V", "P", "U"];

const EMPTY = {
  name: "", description: "", difficulty: "guided", estimated_duration: 15,
  patient_name: "", patient_age: null, patient_condition: "",
  patient_comorbidities: "", patient_medications: "", patient_allergies: "",
  bed_number: "Bed 1",
  initial_vitals: { rr: 16, spo2: 97, supplemental_o2: false, sbp: 120, hr: 80, avpu: "A", temp: 36.6 },
  initial_news2: 0,
  debrief_rationale: "",
  sk_codes: [], performance_outcomes: [],
  category: "deterioration",
  call_bell_speed: "normal", adl_task_source: "pregenerated", adl_tasks: [],
  ehr_drug_chart: "", ehr_nursing_notes: "", ehr_lab_results: "",
};

/** Merged celebrity profile list for the picker. */
const CELEBRITY_PROFILES = [
  ...WARD_PATIENTS.map((p) => ({
    id: `ward_${p.id}`, source: "Ward", name: p.name, age: p.age, pronouns: p.pronouns,
    patient_name: p.name, patient_age: p.age, patient_condition: p.condition,
    patient_comorbidities: p.comorbidities, patient_medications: p.medications,
    patient_allergies: p.allergies, bed_number: `Bed ${p.bedDesignation}`,
    initial_vitals: p.initial_vitals, initial_news2: p.initial_news2,
  })),
  ...SBAR_PATIENTS.map((p) => ({
    id: `sbar_${p.id}`, source: "SBAR", name: p.name, age: p.age, pronouns: p.pronouns,
    patient_name: p.name, patient_age: p.age, patient_condition: p.condition,
    patient_comorbidities: "", patient_medications: "", patient_allergies: "",
    bed_number: `Bed ${p.bed}`, initial_vitals: null, initial_news2: null,
  })),
];

function VitalsField({ icon: Icon, label, value, onChange, inputType = "number", suffix, options }) {
  return (
    <div>
      <label className="text-[11px] font-heading font-semibold text-slate-500 flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {options ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type={inputType}
            value={value ?? ""}
            onChange={(e) => onChange(inputType === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50"
          />
          {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
        </div>
      )}
    </div>
  );
}

export default function ScenarioEditor({ initialScenario, onSave, onCancel, entityName = "Scenario" }) {
  const isTemplate = entityName === "ScenarioTemplate";
  const [draft, setDraft] = useState(() => {
    if (initialScenario) {
      return {
        ...EMPTY,
        ...initialScenario,
        initial_vitals: { ...EMPTY.initial_vitals, ...(initialScenario.initial_vitals || {}) },
      };
    }
    return { ...EMPTY };
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [showEHR, setShowEHR] = useState(false);
  const user = getCurrentUser();

  const isEditing = !!initialScenario?.id;

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const updateVitals = (patch) => setDraft((prev) => ({ ...prev, initial_vitals: { ...prev.initial_vitals, ...patch } }));

  const applyProfile = (profileId) => {
    const profile = CELEBRITY_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    update({
      patient_name: profile.patient_name,
      patient_age: profile.patient_age,
      patient_condition: profile.patient_condition,
      patient_comorbidities: profile.patient_comorbidities || draft.patient_comorbidities,
      patient_medications: profile.patient_medications || draft.patient_medications,
      patient_allergies: profile.patient_allergies || draft.patient_allergies,
      bed_number: profile.bed_number,
      ...(profile.initial_vitals ? { initial_vitals: profile.initial_vitals } : {}),
      ...(profile.initial_news2 != null ? { initial_news2: profile.initial_news2 } : {}),
    });
  };

  const toggleArr = (field, value) => {
    setDraft((prev) => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const validate = () => {
    if (!draft.name?.trim()) return "Scenario name is required.";
    if (!draft.patient_name?.trim()) return "Patient name is required.";
    if (!draft.patient_condition?.trim()) return "Patient condition is required.";
    return "";
  };

  const handleSave = async () => {
    const vErr = validate();
    if (vErr) { setErr(vErr); return; }
    setSaving(true);
    setErr("");
    try {
      const payload = {
        ...draft,
        is_custom: true,
        creator_id: user?.id,
        estimated_duration: Number(draft.estimated_duration) || 15,
        initial_news2: Number(draft.initial_news2) || 0,
        patient_age: draft.patient_age != null ? Number(draft.patient_age) : null,
      };
      let saved;
      if (isEditing) {
        saved = await base44.entities[entityName].update(initialScenario.id, payload);
      } else {
        saved = await base44.entities[entityName].create(payload);
      }
      onSave?.(saved);
    } catch (e) {
      setErr("Unable to save scenario. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {isEditing ? <Copy className="w-4 h-4 text-clinical-teal" /> : <Sparkles className="w-4 h-4 text-clinical-teal" />}
            <h2 className="font-heading font-bold text-sm text-slate-800">{isEditing ? `Edit ${isTemplate ? "Template" : "Scenario"}` : `New ${isTemplate ? "Template" : "Scenario"}`}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close scenario editor" className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          {err && (
            <div className="flex items-center gap-2 rounded-lg bg-clinical-red/10 border border-clinical-red/30 px-3 py-2 text-xs text-clinical-red">
              <AlertCircle className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Scenario Name</label>
              <input value={draft.name || ""} onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Post-Op Deteriorating Patient"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
            </div>
            <div>
              <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Description</label>
              <textarea value={draft.description || ""} onChange={(e) => update({ description: e.target.value })}
                placeholder="Brief clinical summary of the scenario…"
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50 resize-y" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Difficulty</label>
                <select value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50">
                  {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Duration (min)</label>
                <input type="number" value={draft.estimated_duration ?? 15} onChange={(e) => update({ estimated_duration: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Category</label>
                <select value={draft.category || "deterioration"} onChange={(e) => update({ category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {draft.category === "activities_daily_living" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 space-y-3">
              <div>
                <p className="text-xs font-heading font-bold text-blue-900">ADL Call-Bell Controls</p>
                <p className="text-[10px] text-slate-600">Configure the frequency and T Level SK15 activities available to the simulation.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-semibold text-slate-600">Call-bell speed
                  <select value={draft.call_bell_speed || "normal"} onChange={(e) => update({ call_bell_speed: e.target.value })} className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-2 py-2 text-xs">
                    <option value="slow">Slow · 90 seconds</option><option value="normal">Normal · 60 seconds</option><option value="fast">Fast · 30 seconds</option>
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-600">Task source
                  <select value={draft.adl_task_source || "pregenerated"} onChange={(e) => update({ adl_task_source: e.target.value })} className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-2 py-2 text-xs">
                    <option value="pregenerated">All pre-generated</option><option value="specific">Selected tasks only</option><option value="mixed">Selected first, then mixed</option>
                  </select>
                </label>
              </div>
              {draft.adl_task_source !== "pregenerated" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ADL_TASKS.map((task) => (
                    <button key={task.id} type="button" onClick={() => toggleArr("adl_tasks", task.id)}
                      className={`rounded-xl border px-2.5 py-2 text-left text-[10px] transition ${(draft.adl_tasks || []).includes(task.id) ? "border-blue-500 bg-blue-100 text-blue-900" : "border-slate-200 bg-white text-slate-600"}`}>
                      <span className="font-bold">{task.title}</span><span className="block opacity-70">{task.staff} learner{task.staff > 1 ? "s" : ""} required</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Celebrity profile picker */}
          <div>
            <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1.5 block">Celebrity Patient Profile (optional — auto-fills patient fields)</label>
            <div className="flex flex-wrap gap-1.5">
              {CELEBRITY_PROFILES.map((p) => (
                <button key={p.id} onClick={() => applyProfile(p.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-heading font-semibold border transition-all ${draft.patient_name === p.patient_name ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white text-slate-600 border-slate-200 hover:border-clinical-teal/40"}`}>
                  {p.name}<span className="opacity-50 ml-1">·{p.source}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Patient details */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs font-heading font-bold text-slate-700">Patient Details</span></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Patient Name</label>
                <input value={draft.patient_name || ""} onChange={(e) => update({ patient_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Age</label>
                <input type="number" value={draft.patient_age ?? ""} onChange={(e) => update({ patient_age: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Condition</label>
              <input value={draft.patient_condition || ""} onChange={(e) => update({ patient_condition: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Comorbidities</label>
                <input value={draft.patient_comorbidities || ""} onChange={(e) => update({ patient_comorbidities: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Allergies</label>
                <input value={draft.patient_allergies || ""} onChange={(e) => update({ patient_allergies: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Medications</label>
                <input value={draft.patient_medications || ""} onChange={(e) => update({ patient_medications: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
              <div>
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Bed Number</label>
                <input value={draft.bed_number || ""} onChange={(e) => update({ bed_number: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs font-heading font-bold text-slate-700">Initial Vitals</span></div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Supplemental O₂</span>
                <button onClick={() => updateVitals({ supplemental_o2: !draft.initial_vitals.supplemental_o2 })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${draft.initial_vitals.supplemental_o2 ? "bg-clinical-teal" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${draft.initial_vitals.supplemental_o2 ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <VitalsField icon={Wind} label="RR (bpm)" value={draft.initial_vitals.rr} onChange={(v) => updateVitals({ rr: v })} />
              <VitalsField icon={Droplet} label="SpO₂ (%)" value={draft.initial_vitals.spo2} onChange={(v) => updateVitals({ spo2: v })} />
              <VitalsField icon={Heart} label="SBP (mmHg)" value={draft.initial_vitals.sbp} onChange={(v) => updateVitals({ sbp: v })} />
              <VitalsField icon={Heart} label="HR (bpm)" value={draft.initial_vitals.hr} onChange={(v) => updateVitals({ hr: v })} />
              <VitalsField icon={Thermometer} label="Temp (°C)" value={draft.initial_vitals.temp} onChange={(v) => updateVitals({ temp: v })} />
              <VitalsField icon={Brain} label="AVPU" value={draft.initial_vitals.avpu} onChange={(v) => updateVitals({ avpu: v })} options={AVPU_OPTIONS} />
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Initial NEWS2</label>
                <input type="number" value={draft.initial_news2 ?? 0} onChange={(e) => update({ initial_news2: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50" />
              </div>
            </div>
          </div>

          {/* Debrief */}
          <div>
            <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Debrief Rationale</label>
            <textarea value={draft.debrief_rationale || ""} onChange={(e) => update({ debrief_rationale: e.target.value })}
              placeholder="Key learning points for the post-scenario debrief…"
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-clinical-teal/50 resize-y" />
          </div>

          {/* Branching pathways */}
          <div>
            <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1.5 block">Decision Pathway</label>
            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">Build the branching clinical decisions a student works through. Mark the correct response on each option and link it to the next node, or end the scenario for the debrief.</p>
            <DecisionTreeEditor value={draft.decision_tree} onChange={(json) => update({ decision_tree: json })} />
          </div>

          {/* SK / PO codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1.5 block">Skill Codes (SK)</label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto scrollbar-thin">
                {Object.keys(SK_CODES).map((code) => (
                  <button key={code} onClick={() => toggleArr("sk_codes", code)}
                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border transition-all ${(draft.sk_codes || []).includes(code) ? "bg-clinical-teal/15 border-clinical-teal/40 text-clinical-teal" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1.5 block">Performance Outcomes (PO)</label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto scrollbar-thin">
                {Object.keys(PERFORMANCE_OUTCOMES).map((code) => (
                  <button key={code} onClick={() => toggleArr("performance_outcomes", code)}
                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border transition-all ${(draft.performance_outcomes || []).includes(code) ? "bg-blue-500/15 border-blue-500/40 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {draft.sk_codes?.length > 0 || draft.performance_outcomes?.length > 0 ? (
            <SKBadgeGroup skCodes={draft.sk_codes} poCodes={draft.performance_outcomes} />
          ) : null}

          {/* EHR Records (templates only) */}
          {isTemplate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
              <button className="w-full flex items-center justify-between" onClick={() => setShowEHR(!showEHR)}>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-heading font-bold text-slate-700">EHR Records (Optional Overrides)</span>
                </div>
                {showEHR ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {showEHR && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-slate-500 leading-relaxed">Customise the EHR shown for this template. Leave blank to use default patient data. Enter valid JSON.</p>
                  <div>
                    <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Drug Chart (JSON array)</label>
                    <textarea value={draft.ehr_drug_chart || ""} onChange={(e) => update({ ehr_drug_chart: e.target.value })}
                      placeholder='[{"drug":"Paracetamol","dose":"1g","route":"PO","frequency":"QDS","startDate":"01/01/2026","prescriber":"Dr Smith","admin":[{"time":"06:00","status":"given"}]}]'
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-clinical-teal/50 resize-y scrollbar-thin" />
                  </div>
                  <div>
                    <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Nursing Notes (JSON array)</label>
                    <textarea value={draft.ehr_nursing_notes || ""} onChange={(e) => update({ ehr_nursing_notes: e.target.value })}
                      placeholder='[{"type":"admission","timestamp":"2026-01-01T09:00","author":"Dr Smith","content":"..."}]'
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-clinical-teal/50 resize-y scrollbar-thin" />
                  </div>
                  <div>
                    <label className="text-[11px] font-heading font-semibold text-slate-500 mb-1 block">Lab Results (JSON object)</label>
                    <textarea value={draft.ehr_lab_results || ""} onChange={(e) => update({ ehr_lab_results: e.target.value })}
                      placeholder='{"haematology":[{"label":"Haemoglobin (Hb)","value":135}],"abg":[],"biochemistry":[]}'
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-clinical-teal/50 resize-y scrollbar-thin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-heading font-semibold hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-clinical-teal text-white text-xs font-heading font-semibold hover:opacity-90 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : isEditing ? `Update ${isTemplate ? "Template" : "Scenario"}` : `Create ${isTemplate ? "Template" : "Scenario"}`}
          </button>
        </div>
      </div>
    </div>
  );
}