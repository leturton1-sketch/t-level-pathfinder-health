import { useState } from "react";
import { Stethoscope, RefreshCw, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { runDiagnostic, applyWorkaround, getErrors, clearErrors } from "@/lib/diagnosticService";

const SEVERITY = {
  high: { color: "text-clinical-red", bg: "bg-clinical-red/10", Icon: AlertTriangle },
  medium: { color: "text-clinical-amber", bg: "bg-clinical-amber/10", Icon: AlertTriangle },
  low: { color: "text-clinical-teal", bg: "bg-clinical-teal/10", Icon: CheckCircle2 },
};

// Admin-only diagnostic panel rendered inside the AI assistant. Scans the
// running app for errors, shows an AI-produced report with recommended fixes,
// and lets the admin apply any safe runtime workaround (reload). Issues that
// need a code change are flagged "Manual fix required".
export default function AIDiagnostic() {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);

  const scan = async () => {
    setScanning(true);
    setReport(null);
    try {
      setReport(await runDiagnostic());
    } finally {
      setScanning(false);
    }
  };

  const apply = (issue) => {
    setBusy(issue.title);
    const res = applyWorkaround(issue.workaround_action);
    setBusy(null);
    if (!res.applied) alert(res.message);
  };

  const rawCount = getErrors().length;

  if (scanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[200px]">
        <div className="w-9 h-9 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
        <p className="text-[12px] font-heading font-semibold text-slate-600">Scanning app for errors…</p>
        <p className="text-[10px] text-slate-400">Analysing {rawCount} captured event(s)</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-clinical-teal" />
          <h3 className="text-[13px] font-heading font-bold text-slate-800">Diagnostic Mode</h3>
        </div>
        <p className="text-[12px] text-slate-600 leading-relaxed mb-4">
          Scans the running app for JavaScript errors, failed network calls and render crashes, then produces a report with recommended fixes and any safe runtime workarounds.
        </p>
        <div className="rounded-xl border border-border bg-muted/40 p-3 mb-4 text-[11px] text-slate-500">
          Captured this session: <span className="font-bold text-slate-700">{rawCount}</span> event(s)
        </div>
        <div className="flex gap-2">
          <button onClick={scan} className="flex-1 px-3 py-2.5 rounded-xl bg-clinical-teal text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Scan app now
          </button>
          <button onClick={clearErrors} className="px-3 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-slate-600">Clear</button>
        </div>
      </div>
    );
  }

  const issues = report.issues || [];
  const healthColor = report.overall_health === "healthy" ? "text-clinical-green" : report.overall_health === "unstable" ? "text-clinical-red" : "text-clinical-amber";

  return (
    <div className="flex-1 overflow-y-auto p-3 scrollbar-thin min-h-[200px] max-h-[36vh]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[13px] font-heading font-bold text-slate-800">Diagnostic Report</p>
          <p className={`text-[10px] font-semibold ${healthColor}`}>
            {(report.overall_health || "degraded").toUpperCase()} · {report.rawCount ?? 0} events
          </p>
        </div>
        <button onClick={() => setReport(null)} className="text-[11px] text-slate-500 hover:text-slate-700">← Back</button>
      </div>
      <p className="text-[12px] text-slate-600 leading-snug mb-3">{report.summary}</p>

      {issues.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle2 className="w-8 h-8 mx-auto text-clinical-green mb-2" />
          <p className="text-[12px] text-slate-600">No issues found.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {issues.map((issue, i) => {
          const sev = SEVERITY[issue.severity] || SEVERITY.medium;
          const Icon = sev.Icon;
          const actionable = issue.can_auto_fix && issue.workaround_action === "reload";
          return (
            <div key={i} className="rounded-xl border border-border bg-white/70 p-3">
              <div className="flex items-start gap-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${sev.bg} ${sev.color}`}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-slate-800 truncate">{issue.title}</p>
                    {issue.count > 1 && <span className="text-[9px] font-bold text-slate-400">×{issue.count}</span>}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-slate-600">Cause:</span> {issue.likely_cause}</p>
                  <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-slate-600">Fix:</span> {issue.recommended_fix}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {actionable ? (
                      <button onClick={() => apply(issue)} disabled={busy === issue.title} className="px-2.5 py-1.5 rounded-lg bg-clinical-teal text-white text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50">
                        <Wrench className="w-3 h-3" /> Apply workaround
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-semibold text-slate-500 border border-border">Manual fix required</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {report.error && <p className="mt-3 text-[10px] text-clinical-red">{report.error}</p>}

      <button onClick={scan} className="mt-4 w-full px-3 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-slate-600 flex items-center justify-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" /> Re-scan
      </button>
    </div>
  );
}