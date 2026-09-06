import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { SPEC_AREAS } from "@/lib/specData";
import { THEORY_MODULES } from "@/lib/theoryContent";
import CompetencyRadar from "@/components/performance/CompetencyRadar";
import KnowledgeCheckChart from "@/components/performance/KnowledgeCheckChart";
import SKCoverageMatrix from "@/components/performance/SKCoverageMatrix";
import AreaProgressCard from "@/components/performance/AreaProgressCard";
import ProgressOverTime from "@/components/performance/ProgressOverTime";
import { ArrowLeft, BarChart3, BookOpen, Target, Stethoscope, ClipboardList, TrendingUp } from "lucide-react";

export default function Performance() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [results, setResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try { const r = await base44.entities.SimulationResult.filter({ student_id: user?.id }); setResults(r || []); } catch {}
    try { const s = await base44.entities.CarePlanSubmission.filter({ student_id: user?.id }); setSubmissions(s || []); } catch {}
    setLoading(false);
  };

  const theoryProgress = JSON.parse(localStorage.getItem("theory_progress") || "{}");
  const quizScores = JSON.parse(localStorage.getItem("theory_quiz_scores") || "{}");

  // Per-area progress
  const areaData = SPEC_AREAS.map((area) => {
    const mod = THEORY_MODULES.find((m) => m.spec_area === area.code);
    const completed = !!theoryProgress[area.code];
    const quiz = quizScores[area.code];
    const progress = quiz ? quiz.pct : completed ? 50 : 0;
    return { ...area, title_full: mod?.title, completed, quiz, progress, label: area.code.replace("Area ", "A") };
  });

  // SK / PO coverage from simulations, care plans, and completed theory modules
  const coveredSK = new Set();
  const coveredPO = new Set();
  results.forEach((r) => { (r.sk_codes || []).forEach((c) => coveredSK.add(c)); (r.performance_outcomes || []).forEach((c) => coveredPO.add(c)); });
  submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").forEach((s) => {
    (s.sk_codes || []).forEach((c) => coveredSK.add(c)); (s.performance_outcomes || []).forEach((c) => coveredPO.add(c));
  });
  THEORY_MODULES.forEach((m) => {
    if (theoryProgress[m.spec_area]) { (m.sk_codes || []).forEach((c) => coveredSK.add(c)); (m.performance_outcomes || []).forEach((c) => coveredPO.add(c)); }
  });

  // Summary stats
  const modulesComplete = areaData.filter((a) => a.completed).length;
  const quizzesTaken = areaData.filter((a) => a.quiz);
  const avgQuizPct = quizzesTaken.length > 0 ? Math.round(quizzesTaken.reduce((s, a) => s + a.quiz.pct, 0) / quizzesTaken.length) : 0;
  const avgSimScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length) : 0;
  const carePlanSubmitted = submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length;

  const stats = [
    { label: "Modules Complete", value: `${modulesComplete}/9`, icon: BookOpen, color: "text-clinical-teal" },
    { label: "Avg Knowledge Check", value: `${avgQuizPct}%`, icon: Target, color: "text-clinical-green" },
    { label: "Simulations", value: results.length, icon: Stethoscope, color: "text-clinical-amber" },
    { label: "Avg Sim Score", value: `${avgSimScore}%`, icon: TrendingUp, color: "text-clinical-teal" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-clinical-teal" /> Performance Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Pearson T Level Health — competency & knowledge check tracking</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card p-3.5 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Competency radar */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-1">Competency Overview</h2>
        <p className="text-xs text-muted-foreground mb-2">Progress across all 9 spec areas (knowledge check % or completion)</p>
        <CompetencyRadar data={areaData} />
      </div>

      {/* Knowledge check chart */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-1">Knowledge Check Scores</h2>
        <p className="text-xs text-muted-foreground mb-2">Per-area quiz results (% correct)</p>
        <KnowledgeCheckChart data={areaData.filter((a) => a.quiz)} />
        {areaData.filter((a) => a.quiz).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No knowledge checks completed yet. Take a quiz from the Theory modules!</p>
        )}
      </div>

      {/* Progress over time */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-1">Progress Over Time</h2>
        <p className="text-xs text-muted-foreground mb-2">Student development across assessments and skill categories</p>
        <ProgressOverTime results={results} submissions={submissions} />
      </div>

      {/* Area cards */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Spec Area Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {areaData.map((area, idx) => (
            <AreaProgressCard key={area.code} area={area} completed={area.completed} quiz={area.quiz} delay={idx * 40} />
          ))}
        </div>
      </div>

      {/* SK / PO coverage */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-1">Competency Coverage</h2>
        <p className="text-xs text-muted-foreground mb-3">Skills & performance outcomes evidenced through simulations, care plans and theory</p>
        <SKCoverageMatrix coveredSK={coveredSK} coveredPO={coveredPO} />
      </div>

      {/* Activity summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-clinical-teal" />Recent Activity</h2>
        <div className="space-y-2">
          {results.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-clinical-amber" /><span className="text-foreground truncate">{r.scenario_name}</span></div>
              <span className="font-semibold text-clinical-teal">{r.score}%</span>
            </div>
          ))}
          {submissions.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5 text-clinical-green" /><span className="text-foreground truncate">{s.title}</span></div>
              <span className={`font-semibold ${s.status === "reviewed" ? "text-clinical-green" : "text-clinical-amber"}`}>{s.status}</span>
            </div>
          ))}
          {results.length === 0 && submissions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No activity yet — complete simulations and care plans to build your competency profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}