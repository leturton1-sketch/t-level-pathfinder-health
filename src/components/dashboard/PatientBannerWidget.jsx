import { useNavigate } from "react-router-dom";
import { bedOf, newsTone, patientStatus, statusToneClass } from "@/lib/wardBoard";
import Widget3DGraphic from "./Widget3DGraphic";
import { FileText, Activity, Stethoscope, ArrowRightLeft } from "lucide-react";

/**
 * NHS EHR-style patient banner for the selected patient — identity, allergies,
 * NEWS2 band and admit/update/discharge actions.
 */
export default function PatientBannerWidget({ patient, now, onDischarge }) {
  const navigate = useNavigate();
  if (!patient) {
    return (
      <div className="rounded-2xl border border-sky-200/70 bg-card p-6 shadow-sm text-center">
        <Widget3DGraphic type="steth" tone="sky" size="lg" className="mx-auto mb-3" />
        <p className="text-sm font-heading font-semibold text-foreground">Select a patient</p>
        <p className="text-xs text-muted-foreground mt-1">Choose a bed from the ward map or patient list to view their electronic record.</p>
      </div>
    );
  }
  const tone = newsTone(patient.initial_news2);
  const status = patientStatus(patient, now);
  const v = patient.initial_vitals || {};

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-card shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Widget3DGraphic type="clipboard" tone="sky" size="sm" />
          <div>
            <p className="text-[10px] font-heading uppercase tracking-widest text-white/80">Electronic Health Record</p>
            <h3 className="text-base font-heading font-bold text-white">{patient.name}</h3>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-heading font-bold bg-white/95 ${statusToneClass(status.tone)}`}>
          {status.label}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <BannerField label="NHS Number" value={patient.nhs_number} mono />
          <BannerField label="Bed" value={bedOf(patient)} />
          <BannerField label="Age / Sex" value={`${patient.age}y · ${patient.pronouns}`} />
          <BannerField label="DOB" value={patient.dob || "—"} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className={`rounded-xl border p-2.5 ${tone.border} ${tone.bg}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">NEWS2</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-heading font-bold ${tone.text}`}>{patient.initial_news2}</span>
              <span className={`text-[10px] font-bold ${tone.text}`}>{tone.label}</span>
            </div>
          </div>
          <div className="rounded-xl border border-clinical-amber/30 bg-clinical-amber/5 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Allergies</p>
            <p className={`text-xs font-semibold ${patient.allergies && patient.allergies !== "NKDA" ? "text-clinical-amber" : "text-foreground"}`}>{patient.allergies || "NKDA"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Presenting</p>
            <p className="text-xs text-foreground leading-snug line-clamp-2">{patient.condition}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
          {[
            { k: "rr", l: "RR", u: "/min" }, { k: "spo2", l: "SpO₂", u: "%" },
            { k: "sbp", l: "SBP", u: "mmHg" }, { k: "hr", l: "HR", u: "bpm" },
          ].map((m) => (
            <div key={m.k} className="rounded-lg bg-sky-50 border border-sky-100 px-2 py-1.5">
              <span className="text-muted-foreground">{m.l}</span>
              <span className="ml-1 font-heading font-bold text-foreground">{v[m.k] ?? "—"}</span>
              <span className="text-muted-foreground">{m.u}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => navigate("/care-planning")} className="flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-2 text-xs font-heading font-semibold hover:opacity-90">
            <FileText className="w-3.5 h-3.5" /> Update Records
          </button>
          <button onClick={() => navigate("/care-planning/news2")} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-heading font-semibold text-foreground hover:bg-muted/50">
            <Activity className="w-3.5 h-3.5" /> Record Obs
          </button>
          <button onClick={() => navigate("/ward-simulation")} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-heading font-semibold text-foreground hover:bg-muted/50">
            <Stethoscope className="w-3.5 h-3.5" /> View in Ward
          </button>
          <button onClick={() => onDischarge?.(patient)} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-xs font-heading font-semibold hover:bg-emerald-100">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

function BannerField({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}