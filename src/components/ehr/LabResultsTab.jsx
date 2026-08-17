import { Droplet, FlaskConical, Activity } from "lucide-react";
import { LAB_REF_RANGES } from "@/lib/ehrData";

function flagValue(value, ref) {
  if (value == null || !ref) return { status: "pending", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" };
  const { low, high } = ref;
  if (value >= low && value <= high) return { status: "normal", color: "text-clinical-green", bg: "bg-clinical-green/10", border: "border-clinical-green/30" };
  const range = high - low;
  const margin = Math.max(range * 0.1, 0.5);
  if (value >= low - margin && value <= high + margin) return { status: "borderline", color: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30" };
  return { status: "critical", color: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30" };
}

function interpretABG(labResults) {
  const abg = labResults.abg || [];
  const get = (label) => abg.find((a) => a.label === label)?.value;
  const pH = get("pH");
  const pCO2 = get("pCO₂");
  const HCO3 = get("HCO₃⁻");
  if (pH == null || pCO2 == null || HCO3 == null) return null;

  if (pH < 7.35) {
    if (pCO2 > 6.0 && HCO3 > 26) return { label: "Respiratory Acidosis (Partially Compensated)", color: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30", desc: "Low pH + high pCO₂ + raised HCO₃⁻. CO₂ retention with renal compensation. Common in COPD." };
    if (pCO2 > 6.0) return { label: "Respiratory Acidosis (Uncompensated)", color: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30", desc: "Low pH + high pCO₂. CO₂ retention causing acidosis. Escalate urgently." };
    if (HCO3 < 22) return { label: "Metabolic Acidosis", color: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30", desc: "Low pH + low HCO₃⁻. Metabolic acid production or bicarbonate loss." };
    return { label: "Mixed Acidosis", color: "text-clinical-red", bg: "bg-clinical-red/10", border: "border-clinical-red/30", desc: "Low pH with both respiratory and metabolic components." };
  }
  if (pH > 7.45) {
    if (pCO2 < 4.7) return { label: "Respiratory Alkalosis", color: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30", desc: "High pH + low pCO₂. Hyperventilation blowing off CO₂." };
    if (HCO3 > 26) return { label: "Metabolic Alkalosis", color: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30", desc: "High pH + high HCO₃⁻. Acid loss or bicarbonate excess." };
    return { label: "Mixed Alkalosis", color: "text-clinical-amber", bg: "bg-clinical-amber/10", border: "border-clinical-amber/30", desc: "High pH with mixed components." };
  }
  return { label: "Normal pH", color: "text-clinical-green", bg: "bg-clinical-green/10", border: "border-clinical-green/30", desc: "pH within normal range (7.35–7.45)." };
}

function LabRow({ item }) {
  const ref = LAB_REF_RANGES[item.label];
  const flag = flagValue(item.value, ref);
  const arrow = item.value != null && ref ? (item.value < ref.low ? "↓" : item.value > ref.high ? "↑" : "") : "";
  return (
    <div className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${flag.bg} ${flag.border}`}>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
        {ref?.note && <span className="text-[9px] text-slate-400 block">{ref.note}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{ref ? `${ref.low}–${ref.high}` : "—"}</span>
        <span className={`text-sm font-mono font-bold ${flag.color}`}>{item.value ?? "—"}{arrow}</span>
        <span className="text-[9px] text-slate-400">{ref?.unit || ""}</span>
      </div>
    </div>
  );
}

function LabPanel({ title, icon: Icon, items, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className={`px-3 py-2 flex items-center gap-2 ${accent}`}>
        <Icon className="w-3.5 h-3.5" />
        <h4 className="text-xs font-heading font-bold uppercase tracking-wide">{title}</h4>
      </div>
      <div className="p-2 space-y-1.5">
        {items.map((item) => <LabRow key={item.label} item={item} />)}
      </div>
    </div>
  );
}

export default function LabResultsTab({ labResults = {} }) {
  const abgInterp = interpretABG(labResults);

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* ABG interpretation banner */}
      {abgInterp && (
        <div className={`rounded-xl border px-3 py-2.5 ${abgInterp.bg} ${abgInterp.border} flex items-start gap-2`}>
          <Activity className={`w-4 h-4 shrink-0 mt-0.5 ${abgInterp.color}`} />
          <div>
            <p className={`text-xs font-heading font-bold ${abgInterp.color}`}>{abgInterp.label}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">{abgInterp.desc}</p>
          </div>
        </div>
      )}

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LabPanel title="Haematology (FBC)" icon={Droplet} items={labResults.haematology || []} accent="bg-rose-50 text-rose-600" />
        <div className="space-y-3">
          <LabPanel title="Arterial Blood Gas (ABG)" icon={Activity} items={labResults.abg || []} accent="bg-sky-50 text-sky-600" />
          <LabPanel title="Biochemistry / U&Es" icon={FlaskConical} items={labResults.biochemistry || []} accent="bg-amber-50 text-amber-600" />
        </div>
      </div>

      {/* Reference range legend */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wide mb-1">Reference Ranges (NHS/NICE Adult)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
          {Object.entries(LAB_REF_RANGES).map(([label, ref]) => (
            <span key={label} className="font-mono">{label}: {ref.low}–{ref.high} {ref.unit}</span>
          ))}
        </div>
      </div>
    </div>
  );
}