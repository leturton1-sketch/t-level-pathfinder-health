import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Activity, AlertTriangle, BedDouble, ChevronDown, HeartPulse, UsersRound, X } from "lucide-react";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import { initialBoard, INCOMING_PATIENTS } from "@/lib/wardBoard";
import CampusZoomMap from "@/components/dashboard/CampusZoomMap";
import RoleMissionPanel from "@/components/dashboard/RoleMissionPanel";

const STAFF = [
  { name: "Dr Maya Chen", role: "Ward consultant", status: "Available", initials: "MC" },
  { name: "Sam Okafor", role: "Charge nurse", status: "With patient", initials: "SO" },
  { name: "Priya Shah", role: "Staff nurse", status: "Available", initials: "PS" },
  { name: "Alex Morgan", role: "Healthcare assistant", status: "Break · 8 min", initials: "AM" },
];

function DashboardClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return <time className="pf-clock" dateTime={now.toISOString()}>
    {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
    <span>{now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</span>
  </time>;
}

function Metric({ label, value, note, icon: Icon, tone }) {
  return <article className="pf-metric">
    <div><p className="pf-label">{label}</p><p className="pf-value">{value}</p><p className="pf-muted">{note}</p></div>
    <span className={`pf-metric-icon pf-tone-${tone}`}><Icon size={22} aria-hidden="true" /></span>
  </article>;
}

function TeamContent() {
  return <div className="pf-team-scroll">
    <p className="pf-label pf-section-label">Patient & staff <span className="pf-badge">Simulation</span></p>
    <ul className="pf-records" aria-label="Staff on shift">
      {STAFF.map(person => <li key={person.name} className="pf-record">
        <span className="pf-avatar">{person.initials}</span>
        <div className="pf-record-copy"><strong>{person.name}</strong><p>{person.role}</p>
          <span className={`pf-status ${person.status === "Available" ? "pf-status-available" : ""}`}>{person.status}</span>
        </div>
      </li>)}
    </ul>
    <h3 className="pf-label pf-section-label">Incoming patients</h3>
    <ul className="pf-records" aria-label="Incoming patients">
      {INCOMING_PATIENTS.slice(0, 3).map((patient, index) => <li key={patient.id || index} className="pf-record">
        <span className="pf-avatar"><Activity size={20} aria-hidden="true" /></span>
        <div className="pf-record-copy"><strong>{patient.name}</strong><p>{patient.condition || "Awaiting assessment"}</p>
          <span className="pf-status">Expected in {index * 4 + 3} min</span>
        </div>
      </li>)}
    </ul>
  </div>;
}

export default function CommandCenterDashboard() {
  const navigate = useNavigate();
  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);
  const user = getCurrentUser();
  const [activeZone, setActiveZone] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const teamRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const patients = useMemo(() => initialBoard(Date.now()), []);
  const critical = useMemo(() => patients.filter(patient => (patient.initial_news2 ?? 0) >= 5), [patients]);
  const occupancy = useMemo(() => Math.min(100, Math.round((patients.length / 24) * 100)), [patients]);

  const openDrawer = (kind, trigger) => { drawerTriggerRef.current = trigger; setDrawer(kind); };

  return <div className="pf-dashboard">
    <header className="pf-overview-heading"><h1>Pathfinder Overview</h1><DashboardClock /></header>

    <RoleMissionPanel user={user} />

    <button type="button" className="pf-mobile-summary" aria-expanded={metricsOpen} aria-controls="pf-metrics"
      onClick={() => setMetricsOpen(value => !value)}>Overview · {critical.length} alerts · {24 - patients.length} beds available
      <ChevronDown size={18} aria-hidden="true" /></button>
    <section id="pf-metrics" className={`pf-metrics ${metricsOpen ? "pf-metrics-open" : ""}`} aria-label="Simulation overview">
      <Metric label="Critical alerts" value={critical.length} note="Requires clinical review" icon={AlertTriangle} tone="red" />
      <Metric label="Bed availability" value={`${100 - occupancy}%`} note={`${24 - patients.length} of 24 beds available`} icon={BedDouble} tone="green" />
      <Metric label="Patient vitals" value="Stable" note="Simulated observation summary" icon={HeartPulse} tone="blue" />
      <Metric label="Staff on shift" value="18" note="6 clinical · 12 ward team" icon={UsersRound} tone="violet" />
    </section>

    <div className="pf-overview-grid">
      <section className="pf-map-stage" aria-labelledby="pf-map-title">
        <div className="pf-map-heading"><div><p className="pf-eyebrow">Interactive campus</p>
          <h2 id="pf-map-title">Dearne Valley College</h2></div>
          <Link className="pf-secondary-button" to="/ward-simulation"><BedDouble size={18} aria-hidden="true" />Open ward</Link>
        </div>
        <CampusZoomMap activeZone={activeZone} onZoneChange={setActiveZone} />
      </section>

      <aside className="pf-team-rail" aria-label="Patient and staff panel">
        <div className="pf-team-heading"><h2>Response team</h2><span className="pf-badge">{STAFF.length} staff listed</span></div>
        <TeamContent />
      </aside>
    </div>

    <button type="button" ref={teamRef} className="pf-team-trigger pf-primary-button"
      onClick={() => openDrawer("team", teamRef.current)}>
      <UsersRound size={21} aria-hidden="true" />Patient & staff<span className="pf-count">{INCOMING_PATIENTS.slice(0, 3).length}</span>
    </button>

    <Dialog.Root open={drawer !== null} onOpenChange={open => { if (!open) setDrawer(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="pf-drawer-overlay" />
        <Dialog.Content className={`pf-drawer pf-drawer-${drawer}`}
          onCloseAutoFocus={event => { event.preventDefault(); drawerTriggerRef.current?.focus(); }}>
          <div className="pf-drawer-heading">
            <Dialog.Title>Response team</Dialog.Title>
            <Dialog.Close className="pf-icon-button" aria-label="Close panel"><X size={23} /></Dialog.Close>
          </div>
          <Dialog.Description className="pf-drawer-description">
            Simulation staff and incoming patient queues.
          </Dialog.Description>
          <TeamContent />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
