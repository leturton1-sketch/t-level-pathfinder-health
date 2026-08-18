import { scheduledRisks, formatCountdown, RISK_ASSESSMENTS } from "@/lib/wardBoard";
import Widget3DGraphic from "./Widget3DGraphic";
import { ShieldCheck, AlertTriangle, Clock, UserPlus, CheckCircle2 } from "lucide-react";

const STATUS_STYLE = {
  overdue: { wrap: "border-clinical-red/40 bg-clinical-red/10", text: "text-clinical-red", icon: AlertTriangle, label: "Overdue" },
  "due-soon": { wrap: "border-clinical-amber/40 bg-clinical-amber/10", text: "text-clinical-amber", icon: Clock, label: "Due soon" },
  scheduled: { wrap: "border-sky-200 bg-sky-50", text: "text-sky-700", icon: Clock, label: "Scheduled" },
};

/**
 * Scheduled risk assessments for the selected patient (auto-generated on admission)
 * plus the live admissions queue — admitting a new patient schedules their risks.
 */
export default function RiskAssessmentWidget({ patient, now, incoming, onAdmit }) {
  const risks = patient ? scheduledRisks(patient.admittedAt, now) : RISK_ASSESSMENTS.map((r) => ({ ...r, remainingH: r.dueWithinHours, status: "scheduled" }));

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Widget3DGraphic type="shield" tone="mint" size="sm" />
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground">Scheduled Risk Assessments</h3>
            <p className="text-[10px] text-muted-foreground">{patient ? `Auto-scheduled on admission · ${patient.name}` : "Select a patient"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {risks.map((r) => {
          const s = STATUS_STYLE[r.status];
          const Icon = s.icon;
          return (
            <div key={r.id} className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${s.wrap}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${s.text}`} />
                <span className="text-xs font-semibold text-foreground truncate">{r.label}</span>
              </div>
              <span className={`text-[11px] font-heading font-bold ${s.text} shrink-0 ml-2`}>
                {r.status === "overdue" ? "Due now" : formatCountdown(r.remainingH)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Incoming admissions queue */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <UserPlus className="w-3 h-3" /> Admissions Queue · awaiting transfer to ward
        </p>
        {incoming.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-clinical-green" /> No patients waiting — all admitted.
          </div>
        ) : (
          <div className="space-y-1.5">
            {incoming.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50/60 px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.name} · {p.age}y</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.condition} · Bed {p.bed}</p>
                </div>
                <button
                  onClick={() => onAdmit(p)}
                  className="shrink-0 ml-2 rounded-lg bg-clinical-teal text-white px-2.5 py-1.5 text-[11px] font-heading font-semibold hover:opacity-90 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" /> Admit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}