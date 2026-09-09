import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import PatientList from "@/components/dashboard/PatientList";
import LiveWardWidget from "@/components/dashboard/LiveWardWidget";
import PatientBannerWidget from "@/components/dashboard/PatientBannerWidget";
import NEWS2LiveWidget from "@/components/dashboard/NEWS2LiveWidget";
import RiskAssessmentWidget from "@/components/dashboard/RiskAssessmentWidget";
import MandatoryIntakeRiskAssessment from "@/components/dashboard/MandatoryIntakeRiskAssessment";
import WardStatsWidget from "@/components/dashboard/WardStatsWidget";
import { initialBoard, admitIncoming, INCOMING_PATIENTS } from "@/lib/wardBoard";
import { Activity, Clock, Stethoscope, Users, Sliders } from "lucide-react";

const ADMIN_TOOLS = [
  { to: "/scenario-authoring", label: "Scenario Authoring", icon: Stethoscope },
  { to: "/scenario-templates", label: "Templates", icon: Sliders },
  { to: "/user-management", label: "Users", icon: Users },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [now, setNow] = useState(() => Date.now());
  const [patients, setPatients] = useState(() => initialBoard(Date.now()));
  const [incoming, setIncoming] = useState(INCOMING_PATIENTS);
  const [selectedId, setSelectedId] = useState(() => patients[0]?.id);
  const [intakePatient, setIntakePatient] = useState(null);

  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const selected = useMemo(() => patients.find((p) => p.id === selectedId) || patients[0], [patients, selectedId]);

  const handleAdmit = (p) => {
    const admitted = admitIncoming(p, Date.now());
    setPatients((prev) => [...prev, admitted]);
    setIncoming((prev) => prev.filter((x) => x.id !== p.id));
    setSelectedId(admitted.id);
    setIntakePatient(admitted);
  };

  const handleIntakeComplete = (assessment) => {
    setPatients((current) => current.map((patient) =>
      patient.id === intakePatient?.id ? { ...patient, riskAssessment: assessment } : patient
    ));
    try {
      const audit = JSON.parse(localStorage.getItem("clinicaledge_intake_audit") || "[]");
      localStorage.setItem("clinicaledge_intake_audit", JSON.stringify([
        ...audit.slice(-49),
        { patientId: intakePatient?.id, patientName: intakePatient?.name, ...assessment },
      ]));
    } catch {
      // The assessment remains in dashboard state if device storage is unavailable.
    }
    setIntakePatient(null);
  };

  const handleDischarge = (p) => {
    setPatients((prev) => prev.filter((x) => x.id !== p.id));
    setSelectedId(null);
  };

  const isAdmin = ["super_admin", "admin", "tutor"].includes(user?.role);
  const clock = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* NHS-style system header */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-500 text-white">
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/90">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{clock}</span>
              <span className="text-white/50">·</span>
              <span>{date}</span>
            </div>
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
              <div className="rounded-2xl border border-sky-200/70 bg-card p-3 shadow-sm">
                <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">Admin & Tools</p>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_TOOLS.map((t) => (
                    <button key={t.to} onClick={() => navigate(t.to)}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-heading font-semibold text-foreground hover:bg-sky-50 hover:border-sky-300 transition-colors">
                      <t.icon className="w-3.5 h-3.5 text-clinical-teal" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MandatoryIntakeRiskAssessment patient={intakePatient} onComplete={handleIntakeComplete} />
    </div>
  );
}