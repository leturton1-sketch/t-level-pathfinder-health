import { useState } from "react";
import { Stethoscope, RefreshCw, AlertTriangle, CheckCircle2, Wrench, Code2, ClipboardCopy, ChevronDown, ChevronRight, History, ShieldCheck, Bug } from "lucide-react";
import { runDiagnostic, runSecurityScan, applyRemediation, remediationLabel, getErrors, clearErrors, getRemediationLog } from "@/lib/diagnosticService";

const SEVERITY = {
  high: { color: "text-clinical-red", bg: "bg-clinical-red/10", Icon: AlertTriangle },
  medium: { color: "text-clinical-amber", bg: "bg-clinical-amber/10", Icon: AlertTriangle },
  low: { color: "text-clinical-teal", bg: "bg-clinical-teal/10", Icon: CheckCircle2 },
};

const SECURITY_SEVERITY = {
  critical: { color: "text-red-700", bg: "bg-red-100", Icon: AlertTriangle, label: "Critical" },
  high: { color: "text-clinical-red", bg: "bg-clinical-red/10", Icon: AlertTriangle, label: "High" },
  medium: { color: "text-clinical-amber", bg: "bg-clinical-amber/10", Icon: AlertTriangle, label: "Medium" },
  low: { color: "text-clinical-teal", bg: "bg-clinical-teal/10", Icon: CheckCircle2, label: "Low" },
  info: { color: "text-sky-600", bg: "bg-sky-100", Icon: CheckCircle2, label: "Info" },
};

const CATEGORY_LABEL = {
  rls: "Row-level security",
  xss: "XSS / injection",
  auth: "Authentication",
  secrets: "Secret handling",
  validation: "Input validation",
  exposure: "Data exposure",
  deprecation: "Deprecated surface",
};

function formatPatch(issue) {
  const sf = issue?.source_fix;
  if (!sf) return "";
  return `// File: ${sf.file}\n// ${sf.explanation || ""}\n// FIND:\n${sf.find}\n// REPLACE WITH:\n${sf.replace}`;
}

// Admin-only diagnostic panel rendered inside the AI assistant. Two modes:
// "errors" scans the running app for runtime errors; "security" systematically
// reviews the app's security manifest and triages findings by severity. Both
// prescribe safe runtime fixes the panel can apply, plus a copyable source
// patch for the builder to make the fix permanent.
export default function AIDiagnostic() {
  const [mode, setMode] = useState("errors");
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);
  const [applied, setApplied] = useState(() => new Set());
  const [expandedFix, setExpandedFix] = useState(null);
  const [copied, setCopied] = useState(null);

  const scan = async () => {
    setScanning(true);
    setReport(null);
    try {
      setReport(mode === "security" ? await runSecurityScan() : await runDiagnostic());
    } finally {
      setScanning(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setReport(null);
  };

  const apply = (issue) => {
    setBusy(issue.title);
    const res = applyRemediation(issue);
    setBusy(null);
    if (res.applied) {
      setApplied((prev) => new Set(prev).add(issue.title));
    } else {
      alert(res.message);
    }
  };

  const copyFix = async (issue) => {
    const patch = formatPatch(issue);
    if (!patch) return;
    try {
      await navigator.clipboard.writeText(patch);
      setCopied(issue.title);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const rawCount = getErrors().length;
  const remediationLog = getRemediationLog();
  const isSecurity = report?.scanType === "security";

  if (scanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[200px]">
        <div className="w-9 h-9 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
        <p className="text-[12px] font-heading font-semibold text-slate-600">
          {mode === "security" ? "Reviewing security manifest…" : "Scanning app for errors…"}
        </p>
        <p className="text-[10px] text-slate-400">
          {mode === "security" ? "Triaging findings by severity" : `Analysing ${rawCount} captured event(s)`}
        </p>
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

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/50 mb-3">
          <button onClick={() => switchMode("errors")} className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${mode === "errors" ? "bg-white text-clinical-teal shadow-sm" : "text-slate-500"}`}>
            <Bug className="w-3.5 h-3.5" /> Errors
          </button>
          <button onClick={() => switchMode("security")} className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${mode === "security" ? "bg-white text-clinical-teal shadow-sm" : "text-slate-500"}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> Security
          </button>
        </div>

        <p className="text-[12px] text-slate-600 leading-relaxed mb-4">
          {mode === "security"
            ? "Systematically reviews the app's security manifest — entity RLS, backend functions, and risk areas — and triages every finding by severity, with a runtime fix and a source patch for each."
            : "Scans the running app for JavaScript errors, failed network calls and render crashes. The AI prescribes a safe runtime fix it can apply now, plus the exact source edit for the builder to make the fix permanent."}
        </p>

        {mode === "errors" && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 mb-4 text-[11px] text-slate-500">
            Captured this session: <span className="font-bold text-slate-700">{rawCount}</span> event(s)
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={scan} className="flex-1 px-3 py-2.5 rounded-xl bg-clinical-teal text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> {mode === "security" ? "Run security scan" : "Scan app now"}
          </button>
          {mode === "errors" && <button onClick={clearErrors} className="px-3 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-slate-600">Clear</button>}
        </div>
      </div>
    );
  }

  const issues = report.issues || [];
  const healthKey = isSecurity ? report.overall_risk : report.overall_health;
  const healthColor = healthKey === "secure" || healthKey === "healthy"
    ? "text-clinical-green"
    : healthKey === "at_risk" || healthKey === "unstable"
      ? "text-clinical-red"
      : "text-clinical-amber";
  const healthLabel = isSecurity ? (report.overall_risk || "review").toUpperCase() : (report.overall_health || "degraded").toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto p-3 scrollbar-thin min-h-[200px] max-h-[36vh]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[13px] font-heading font-bold text-slate-800">{isSecurity ? "Security Report" : "Diagnostic Report"}</p>
          <p className={`text-[10px] font-semibold ${healthColor}`}>
            {healthLabel} {isSecurity && report.manifestVersion ? `· manifest v${report.manifestVersion}` : `· ${report.rawCount ?? 0} events`}
          </p>
        </div>
        <button onClick={() => setReport(null)} className="text-[11px] text-slate-500 hover:text-slate-700">← Back</button>
      </div>
      <p className="text-[12px] text-slate-600 leading-snug mb-3">{report.summary}</p>

      {issues.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle2 className="w-8 h-8 mx-auto text-clinical-green mb-2" />
          <p className="text-[12px] text-slate-600">{isSecurity ? "No security issues found." : "No issues found."}</p>
        </div>
      )}

      {isSecurity && issues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {["critical", "high", "medium", "low", "info"].map((sev) => {
            const count = issues.filter((i) => i.severity === sev).length;
            if (!count) return null;
            const s = SECURITY_SEVERITY[sev];
            return (
              <span key={sev} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${s.bg} ${s.color} flex items-center gap-1`}>
                <s.Icon className="w-3 h-3" /> {s.label} · {count}
              </span>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        {issues.map((issue, i) => {
          const sev = isSecurity ? (SECURITY_SEVERITY[issue.severity] || SECURITY_SEVERITY.medium) : (SEVERITY[issue.severity] || SEVERITY.medium);
          const Icon = sev.Icon;
          const action = issue.remediation?.action || issue.workaround_action || "dismiss";
          const isAuto = issue.can_auto_fix && action !== "dismiss";
          const isApplied = applied.has(issue.title);
          const hasSourceFix = !!issue.source_fix?.file;
          const isOpen = expandedFix === issue.title;
          return (
            <div key={i} className="rounded-xl border border-border bg-white/70 p-3">
              <div className="flex items-start gap-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${sev.bg} ${sev.color}`}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12px] font-bold text-slate-800 truncate">{issue.title}</p>
                    {issue.count > 1 && <span className="text-[9px] font-bold text-slate-400">×{issue.count}</span>}
                    {isSecurity && issue.category && <span className="text-[9px] font-bold text-slate-400">· {CATEGORY_LABEL[issue.category] || issue.category}</span>}
                    {isSecurity && <span className={`text-[9px] font-bold ${sev.color}`}>{sev.label || issue.severity}</span>}
                    {isApplied && <span className="text-[9px] font-bold text-clinical-green">✓ Fixed</span>}
                  </div>
                  {isSecurity && issue.affected_resource && <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Resource: {issue.affected_resource}</p>}
                  <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-slate-600">{isSecurity ? "Issue:" : "Cause:"}</span> {isSecurity ? issue.description : issue.likely_cause}</p>
                  <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-slate-600">{isSecurity ? "Recommendation:" : "Fix:"}</span> {isSecurity ? issue.recommendation : issue.recommended_fix}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isAuto && !isApplied && (
                      <button onClick={() => apply(issue)} disabled={busy === issue.title} className="px-2.5 py-1.5 rounded-lg bg-clinical-teal text-white text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50">
                        <Wrench className="w-3 h-3" /> {remediationLabel(action)}
                      </button>
                    )}
                    {isAuto && isApplied && (
                      <span className="px-2 py-1 rounded-lg bg-clinical-green/10 border border-clinical-green/30 text-[10px] font-semibold text-clinical-green flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {remediationLabel(action)} applied
                      </span>
                    )}
                    {!isAuto && (
                      <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-semibold text-slate-500 border border-border">Source fix required</span>
                    )}
                    {hasSourceFix && (
                      <button onClick={() => setExpandedFix(isOpen ? null : issue.title)} className="px-2 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-slate-600 flex items-center gap-1 hover:bg-muted/40">
                        <Code2 className="w-3 h-3" /> Source fix
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {hasSourceFix && isOpen && (
                    <div className="mt-2 rounded-lg border border-border bg-slate-50 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{issue.source_fix.file}</p>
                        <button onClick={() => copyFix(issue)} className="text-[10px] font-semibold text-clinical-teal flex items-center gap-1 hover:underline">
                          <ClipboardCopy className="w-3 h-3" /> {copied === issue.title ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1.5">{issue.source_fix.explanation}</p>
                      <pre className="text-[9.5px] leading-snug text-slate-700 bg-white rounded-md border border-border p-2 overflow-x-auto scrollbar-thin whitespace-pre">{formatPatch(issue)}</pre>
                      <p className="mt-1.5 text-[9.5px] text-slate-400">Hand this patch to the builder to make the fix permanent in the source.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {report.error && <p className="mt-3 text-[10px] text-clinical-red">{report.error}</p>}

      {remediationLog.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5"><History className="w-3 h-3" /> Remediation log</p>
          <div className="space-y-1">
            {remediationLog.slice(-6).reverse().map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${entry.applied ? "bg-clinical-green" : "bg-clinical-red"}`} />
                <span className="font-semibold text-slate-700 truncate flex-1">{entry.title}</span>
                <span className="text-slate-400">{remediationLabel(entry.action)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={scan} className="mt-4 w-full px-3 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-slate-600 flex items-center justify-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" /> {isSecurity ? "Re-scan security" : "Re-scan"}
      </button>
    </div>
  );
}