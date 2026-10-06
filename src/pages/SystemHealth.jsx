import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isAdmin } from "@/lib/clinicalAuth";
import { getErrors, runDiagnostic, runSecurityScan } from "@/lib/diagnosticService";
import { Activity, CheckCircle2, ShieldCheck, AlertTriangle, Database, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";

export default function SystemHealth() {
  const user = getCurrentUser();
  const [audit, setAudit] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [report, setReport] = useState(null);
  const [secReport, setSecReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [secRunning, setSecRunning] = useState(false);

  useEffect(() => {
    if (!isAdmin()) return;
    (async () => {
      try { setAudit((await base44.entities.AuthAudit.list("-occurred_at", 30)) || []); } catch {}
      try { setAppUsers((await base44.entities.AppUser.list()) || []); } catch {}
    })();
  }, []);

  const failed = audit.filter((x) => !x.success).length;
  const inactive = appUsers.filter((x) => x.active === false).length;
  const protectedUsers = appUsers.filter((x) => x.is_protected).length;
  const runtimeErrors = getErrors().length;
  const identityHealthy = !!user?.id && !!user?.role && user?.active !== false;
  const overall = useMemo(() => failed > 5 || runtimeErrors > 8 ? "Attention required" : "Operational", [failed, runtimeErrors]);

  const scan = async () => {
    setRunning(true);
    setReport(await runDiagnostic());
    setRunning(false);
  };

  const secScan = async () => {
    setSecRunning(true);
    setSecReport(await runSecurityScan());
    setSecRunning(false);
  };

  const secRiskTone = secReport?.overall_risk === "secure" ? "text-emerald-600" : secReport?.overall_risk === "at_risk" ? "text-rose-600" : "text-amber-600";

  if (!isAdmin()) return <div className="clinical-page-shell"><p>Administrator access required.</p></div>;

  const cards = [
    ["System status", overall, Activity, overall === "Operational" ? "text-emerald-600" : "text-amber-600"],
    ["Identity authority", identityHealthy ? "Healthy" : "Check account", ShieldCheck, identityHealthy ? "text-emerald-600" : "text-rose-600"],
    ["Failed logins", failed, KeyRound, failed ? "text-amber-600" : "text-emerald-600"],
    ["Runtime errors", runtimeErrors, AlertTriangle, runtimeErrors ? "text-amber-600" : "text-emerald-600"],
    ["Inactive users", inactive, Database, inactive ? "text-amber-600" : "text-emerald-600"],
    ["Protected accounts", protectedUsers, CheckCircle2, "text-blue-600"],
  ];

  return <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div><p className="pf-eyebrow">Administration</p><h1 className="text-2xl font-black">System Health & Authentication Diagnostics</h1><p className="mt-1 text-sm text-muted-foreground">Identity, login history, runtime stability and protected-account status.</p></div>
      <div className="flex gap-2">
        <button onClick={scan} disabled={running} className="pf-primary-button"><RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />{running ? "Scanning" : "Run diagnostic"}</button>
        <button onClick={secScan} disabled={secRunning} className="pf-primary-button"><ShieldAlert className={`h-4 w-4 ${secRunning ? "animate-spin" : ""}`} />{secRunning ? "Scanning" : "Run security scan"}</button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label,value,Icon,tone]) => <article key={label} className="rounded-2xl border bg-card p-4"><Icon className={`h-5 w-5 ${tone}`} /><p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{value}</p></article>)}</div>
    {report && <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black">Diagnostic result · {report.overall_health}</h2><p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>{report.issues?.map((i,idx)=><div key={idx} className="mt-3 rounded-xl border p-3"><div className="flex justify-between"><strong>{i.title}</strong><span className="text-xs uppercase">{i.severity}</span></div><p className="mt-1 text-xs text-muted-foreground">{i.likely_cause}</p><p className="mt-2 text-sm">{i.recommended_fix}</p></div>)}</section>}
    {secReport && <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black flex items-center gap-2">Security review · <span className={secRiskTone}>{(secReport.overall_risk || "review").toUpperCase()}</span></h2><p className="mt-2 text-sm text-muted-foreground">{secReport.summary}</p>{secReport.error && <p className="mt-2 text-xs text-rose-600">{secReport.error}</p>}{secReport.issues?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{["critical","high","medium","low","info"].map((sev)=>{const c=secReport.issues.filter((i)=>i.severity===sev).length;return c? <span key={sev} className="rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize">{sev} · {c}</span>:null})}</div>}{secReport.issues?.map((i,idx)=><div key={idx} className="mt-3 rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{i.title}</strong><span className="text-xs font-bold uppercase">{i.severity} · {i.category}</span></div>{i.affected_resource && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{i.affected_resource}</p>}<p className="mt-1 text-xs text-muted-foreground">{i.description}</p><p className="mt-2 text-sm">{i.recommendation}</p>{i.source_fix && <pre className="mt-2 overflow-x-auto rounded-lg border bg-slate-50 p-2 text-[10px] leading-snug whitespace-pre">{`// ${i.source_fix.file}\n// ${i.source_fix.explanation}\n// FIND:\n${i.source_fix.find}\n// REPLACE WITH:\n${i.source_fix.replace}`}</pre>}</div>)}</section>}
    <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black">Recent authentication events</h2><div className="mt-3 space-y-2">{audit.slice(0,15).map((a)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"><span><strong>{a.username || "Unknown"}</strong> · {String(a.event).replaceAll("_"," ")}</span><span className={a.success ? "text-emerald-700" : "text-rose-700"}>{a.success ? "Success" : "Failed"} · {a.occurred_at ? new Date(a.occurred_at).toLocaleString("en-GB") : ""}</span></div>)}</div></section>
  </div>;
}