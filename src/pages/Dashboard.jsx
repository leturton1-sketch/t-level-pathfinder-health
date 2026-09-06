import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { useToast } from "@/components/ui/use-toast";
import TLevelLogo from "@/components/TLevelLogo";
import PatientList from "@/components/dashboard/PatientList";
import LiveWardWidget from "@/components/dashboard/LiveWardWidget";
import PatientBannerWidget from "@/components/dashboard/PatientBannerWidget";
import NEWS2LiveWidget from "@/components/dashboard/NEWS2LiveWidget";
import RiskAssessmentWidget from "@/components/dashboard/RiskAssessmentWidget";
import MandatoryIntakeRiskAssessment from "@/components/dashboard/MandatoryIntakeRiskAssessment";
import WardStatsWidget from "@/components/dashboard/WardStatsWidget";
import { INCOMING_PATIENTS } from "@/lib/wardBoard";
import { readStoredValue, writeStoredValue } from "@/lib/localStorage";
import { useWardBoard } from "@/hooks/useWardBoard";
import { Activity, Clock, Stethoscope, Users, Sparkles, Bot, Sliders, FileText, LogOut } from "lucide-react";

const ADMIN_TOOLS = [
  { to: "/scenario-authoring", label: "Scenario Authoring", icon: Stethoscope },
  { to: "/scenario-templates", label: "Templates", icon: Sliders },
  { to: "/user-management", label: "Users", icon: Users },
  { to: "/profile", label: "AI Tutor", icon: Sparkles },
  { to: "/voice-assistant", label: "Voice Assistant", icon: Bot },
];

function WardClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateTime = new Date(now);
  const clock = dateTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = dateTime.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/90" aria-label={`Current time ${clock}, ${date}`}>
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      <time className="font-mono" dateTime={dateTime.toISOString()}>{clock}</time>
      <span className="text-white/50" aria-hidden="true">·</span>
      <span>{date}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const [now, setNow] = useState(() => Date.now());
  const [intakePatient, setIntakePatient] = useState(null);
  const board = useWardBoard();
  const { patients, incoming, selected, selectedId, setSelectedId, setPatients, admit, discharge } = board;
  useEffect(() => board.setIncoming(INCOMING_PATIENTS), [board.setIncoming]);

  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleAdmit = (p) => {
    const admitted = admit(p);
    setIntakePatient(admitted);
  };

  const handleIntakeComplete = (assessment) => {
    setPatients((current) => current.map((patient) =>
      patient.id === intakePatient?.id ? { ...patient, riskAssessment: assessment } : patient
    ));
    const audit = readStoredValue("clinicaledge_intake_audit", []);
    const saved = writeStoredValue("clinicaledge_intake_audit", [
      ...audit.slice(-49),
      { patientId: intakePatient?.id, patientName: intakePatient?.name, ...assessment },
    ]);
    if (!saved) {
      toast({
        title: "Assessment saved for this session",
        description: "Device storage was unavailable, so the audit could not be persisted.",
        variant: "destructive",
      });
    }
    setIntakePatient(null);
  };

  const handleDischarge = (p) => {
    discharge(p);
  };

  const isAdmin = ["super_admin", "admin", "tutor"].includes(user?.role);
  return (
    <div className="pf-clinical-dashboard min-h-screen bg-background pb-24">
      {/* NHS-style system header */}
      <div className="pf-dashboard-header text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-heading uppercase tracking-widest text-white/80 truncate">Pathfinder Health · Patient Management</p>
              <h1 className="text-sm sm:text-base font-heading font-bold truncate">Ward Board · Admit · Discharge · Update</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <WardClock />
            <TLevelLogo size="sm" dark />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Left: patient list */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <PatientList patients={patients} selectedId={selected?.id} onSelect={setSelectedId} now={now} />
          </div>

          {/* Right: live widget grid */}
          <div className="space-y-4">
            <PatientBannerWidget patient={selected} now={now} onDischarge={handleDischarge} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NEWS2LiveWidget patient={selected} />
              <RiskAssessmentWidget patient={selected} now={now} incoming={incoming} onAdmit={handleAdmit} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiveWardWidget patients={patients} selectedId={selected?.id} onSelect={setSelectedId} />
              <WardStatsWidget patients={patients} incoming={incoming} now={now} />
            </div>

            {isAdmin && (
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">Admin & Tools</p>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_TOOLS.map((t) => (
                    <Link key={t.to} to={t.to}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-heading font-semibold text-foreground hover:bg-sky-50 hover:border-sky-300 transition-colors">
                      <t.icon className="w-3.5 h-3.5 text-clinical-teal" aria-hidden="true" /> {t.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <nav className="pf-mobile-actions" aria-label="Current patient actions">
          <Link to="/care-planning" aria-label="Update records">
            <FileText aria-hidden="true" /> <span>Records</span>
          </Link>
          <Link to="/care-planning/news2" aria-label="Record observations">
            <Activity aria-hidden="true" /> <span>Observations</span>
          </Link>
          <Link to="/ward-simulation" aria-label="View patient in ward">
            <Stethoscope aria-hidden="true" /> <span>Ward</span>
          </Link>
          <button type="button" onClick={() => handleDischarge(selected)} aria-label={`Discharge ${selected.name}`}>
            <LogOut aria-hidden="true" /> <span>Discharge</span>
          </button>
        </nav>
      )}
      <MandatoryIntakeRiskAssessment patient={intakePatient} onComplete={handleIntakeComplete} />
    </div>
  );
}