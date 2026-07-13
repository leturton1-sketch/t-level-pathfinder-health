import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import OverheadLight from "@/components/OverheadLight";
import DashboardWidget from "@/components/DashboardWidget";
import WardMiniMonitor from "@/components/WardMiniMonitor";
import { BookOpen, ClipboardList, Stethoscope, Library, BarChart3, AlertTriangle, Activity } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [booting, setBooting] = useState(true);
  const [patients, setPatients] = useState([]);
  const [modulesComplete, setModulesComplete] = useState(0);
  const [submissionsPending, setSubmissionsPending] = useState(0);
  const [simResults, setSimResults] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setBooting(false), 800);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const scenarios = await base44.entities.Scenario.list();
      const activePatients = scenarios.slice(0, 6).map((s) => ({
        name: s.patient_name,
        news2_score: s.initial_news2 || 0,
        bed: s.bed_number,
        condition: s.patient_condition,
      }));
      setPatients(activePatients);
    } catch (err) {
      // Use fallback data if loading fails
      setPatients([
        { name: "M. Thompson", news2_score: 7, bed: "Bed 3", condition: "Post-op deterioration" },
        { name: "D. Patel", news2_score: 5, bed: "Bed 2", condition: "Fluid overload" },
        { name: "J. Wilson", news2_score: 0, bed: "Bed 1", condition: "MRSA admission" },
        { name: "A. Greene", news2_score: 4, bed: "Bed 4", condition: "Falls risk" },
      ]);
    }

    if (user.role === "student") {
      try {
        const results = await base44.entities.SimulationResult.filter({ student_id: user.id });
        setSimResults(results.length);
      } catch {}
      try {
        const submissions = await base44.entities.CarePlanSubmission.filter({
          student_id: user.id,
          status: "submitted",
        });
        setSubmissionsPending(submissions.length);
      } catch {}
    }
  };

  const highRiskPatients = patients.filter((p) => p.news2_score >= 7);
  const mediumRiskPatients = patients.filter((p) => p.news2_score >= 5 && p.news2_score <= 6);

  if (booting) {
    return (
      <div className="fixed inset-0 bg-clinical-navy flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center"><OverheadLight /></div>
          <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">Initialising clinical dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-navy">
      {/* Overhead light */}
      <div className="sticky top-0 z-20 flex justify-center pt-2 pb-1 bg-gradient-to-b from-clinical-navy via-clinical-navy/90 to-transparent">
        <OverheadLight />
      </div>

      <div className="px-4 pt-2 pb-24 max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="mb-4 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-xl font-bold text-foreground mt-0.5">
            Welcome, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "super_admin" && "Super Admin — Full system access"}
            {user?.role === "admin" && "Institution Admin"}
            {user?.role === "tutor" && "Lecturer — Cohort management"}
            {user?.role === "student" && "Student — Adult Nursing pathway"}
          </p>
        </div>

        {/* NEWS2 Alert Banner */}
        {(highRiskPatients.length > 0 || mediumRiskPatients.length > 0) && (
          <div
            className={`mb-4 rounded-xl border p-3 animate-slide-up ${
              highRiskPatients.length > 0
                ? "border-clinical-red/50 bg-clinical-red/10 animate-pulse-red"
                : "border-clinical-amber/50 bg-clinical-amber/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${highRiskPatients.length > 0 ? "text-clinical-red" : "text-clinical-amber"}`} />
              <div className="flex-1">
                <span className="text-sm font-bold text-foreground">
                  {highRiskPatients.length > 0 ? "HIGH RISK — NEWS2 Escalation Required" : "MEDIUM RISK — Urgent Review Needed"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {highRiskPatients.map((p) => `${p.name} (NEWS2: ${p.news2_score})`).join(", ")}
                  {highRiskPatients.length > 0 && mediumRiskPatients.length > 0 && " · "}
                  {mediumRiskPatients.map((p) => `${p.name} (NEWS2: ${p.news2_score})`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Virtual Ward Mini Monitor */}
        <div className="mb-4">
          <WardMiniMonitor patients={patients} />
        </div>

        {/* Module widgets grid */}
        <div className="grid grid-cols-2 gap-3">
          <DashboardWidget
            title="Theory Modules"
            subtitle="T Level specification content"
            icon={BookOpen}
            metric={`${modulesComplete}/6`}
            metricLabel="Modules complete"
            accent="clinical-teal"
            to="/theory"
            delay={100}
          />
          <DashboardWidget
            title="Care Planning"
            subtitle="ABCDE, NEWS2, SMART goals"
            icon={ClipboardList}
            metric={submissionsPending}
            metricLabel="Awaiting feedback"
            accent="clinical-green"
            to="/care-planning"
            delay={150}
          />
          <DashboardWidget
            title="3D Ward Simulation"
            subtitle="Interactive patient scenarios"
            icon={Stethoscope}
            metric={simResults}
            metricLabel="Simulations completed"
            accent="clinical-amber"
            to="/ward-simulation"
            delay={200}
          />
          <DashboardWidget
            title="Knowledge Library"
            subtitle="Clinical reference & evidence"
            icon={Library}
            accent="primary"
            to="/knowledge-library"
            delay={250}
          />
          {(user?.role === "tutor" || user?.role === "admin" || user?.role === "super_admin") && (
            <DashboardWidget
              title="Analytics"
              subtitle="Cohort performance metrics"
              icon={BarChart3}
              accent="primary"
              to="/profile"
              delay={300}
            />
          )}
          {user?.role !== "student" && (
            <DashboardWidget
              title="User Management"
              subtitle="Manage staff & students"
              icon={Activity}
              accent="clinical-teal"
              to="/user-management"
              delay={350}
            />
          )}
        </div>
      </div>
    </div>
  );
}