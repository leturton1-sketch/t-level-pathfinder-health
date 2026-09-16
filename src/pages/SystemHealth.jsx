import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isAdmin } from "@/lib/clinicalAuth";
import { getErrors, runDiagnostic } from "@/lib/diagnosticService";
import { Activity, CheckCircle2, ShieldCheck, AlertTriangle, Database, KeyRound, RefreshCw } from "lucide-react";

export default function SystemHealth() {
  const user = getCurrentUser();
  const [audit, setAudit] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);

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
      <button onClick={scan} disabled={running} className="pf-primary-button"><RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />{running ? "Scanning" : "Run diagnostic"}</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label,value,Icon,tone]) => <article key={label} className="rounded-2xl border bg-card p-4"><Icon className={`h-5 w-5 ${tone}`} /><p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{value}</p></article>)}</div>
    {report && <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black">Diagnostic result · {report.overall_health}</h2><p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>{report.issues?.map((i,idx)=><div key={idx} className="mt-3 rounded-xl border p-3"><div className="flex justify-between"><strong>{i.title}</strong><span className="text-xs uppercase">{i.severity}</span></div><p className="mt-1 text-xs text-muted-foreground">{i.likely_cause}</p><p className="mt-2 text-sm">{i.recommended_fix}</p></div>)}</section>}
    <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black">Recent authentication events</h2><div className="mt-3 space-y-2">{audit.slice(0,15).map((a)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"><span><strong>{a.username || "Unknown"}</strong> · {String(a.event).replaceAll("_"," ")}</span><span className={a.success ? "text-emerald-700" : "text-rose-700"}>{a.success ? "Success" : "Failed"} · {a.occurred_at ? new Date(a.occurred_at).toLocaleString("en-GB") : ""}</span></div>)}</div></section>
  </div>;
}
