import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser, logout } from "@/lib/clinicalAuth";
import { SK_CODES } from "@/lib/specData";
import { BookOpen, ClipboardList, Stethoscope, LogOut, BarChart3, Target, TrendingUp } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [results, setResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [modulesComplete, setModulesComplete] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try { const r = await base44.entities.SimulationResult.filter({ student_id: user.id }); setResults(r); } catch {}
    try { const s = await base44.entities.CarePlanSubmission.filter({ student_id: user.id }); setSubmissions(s); } catch {}
    const progress = JSON.parse(localStorage.getItem("theory_progress") || "{}");
    setModulesComplete(Object.values(progress).filter(Boolean).length);
  };

  const handleLogout = () => {
    const providerRedirectStarted = logout();
    if (!providerRedirectStarted) navigate("/login");
  };

  const avgSimScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) : 0;
  const submittedCount = submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length;

  const stats = [
    { label: "Theory Modules", value: `${modulesComplete}/6`, icon: BookOpen, color: "text-clinical-teal" },
    { label: "Care Plans", value: submittedCount, icon: ClipboardList, color: "text-clinical-green" },
    { label: "Simulations", value: results.length, icon: Stethoscope, color: "text-clinical-amber" },
    { label: "Avg Sim Score", value: `${avgSimScore}%`, icon: Target, color: "text-clinical-teal" },
  ];

  return (
    <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
          user?.role === "super_admin" ? "bg-blue-500/20 text-blue-600" :
          user?.role === "admin" ? "bg-clinical-teal/20 text-clinical-teal" :
          user?.role === "tutor" ? "bg-clinical-green/20 text-clinical-green" :
          "bg-clinical-teal/20 text-clinical-teal"
        }`}>
          {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{user?.full_name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {user?.role === "super_admin" ? "Super Admin" : user?.role === "admin" ? "Institution Admin" : user?.role === "tutor" ? "Lecturer" : "Student — Adult Nursing"}
          </p>
          {user?.cohort && <p className="text-xs text-muted-foreground">{user.cohort}</p>}
        </div>
        <button onClick={handleLogout} className="p-2.5 rounded-lg border border-clinical-red/30 text-clinical-red hover:bg-clinical-red/10 transition-colors" title="Log out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card p-4 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-center justify-between mb-2"><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Competency matrix */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-clinical-teal" />Competency Matrix</h2>
        <p className="text-xs text-muted-foreground mb-3">Skill codes mapped to T Level Performance Outcomes</p>
        <div className="space-y-1.5">
          {Object.entries(SK_CODES).slice(0, 10).map(([code, desc]) => {
            const completed = results.some((r) => (r.sk_codes || []).includes(code)) || submissions.some((s) => ["submitted", "reviewed"].includes(s.status) && (s.sk_codes || []).includes(code));
            return (
              <div key={code} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-clinical-teal w-10">{code}</span>
                <span className="text-muted-foreground flex-1 truncate">{desc}</span>
                <div className={`w-2 h-2 rounded-full ${completed ? "bg-clinical-green" : "bg-muted-foreground/30"}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-clinical-teal" />Recent Activity</h2>
        <div className="space-y-2">
          {results.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-clinical-amber" /><span className="text-foreground">{r.scenario_name}</span></div>
              <span className="font-semibold text-clinical-teal">{r.score}%</span>
            </div>
          ))}
          {submissions.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5 text-clinical-green" /><span className="text-foreground">{s.title}</span></div>
              <span className={`font-semibold ${s.status === "reviewed" ? "text-clinical-green" : "text-clinical-amber"}`}>{s.status}</span>
            </div>
          ))}
          {results.length === 0 && submissions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No activity yet. Start a module or simulation!</p>
          )}
        </div>
      </div>
    </div>
  );
}