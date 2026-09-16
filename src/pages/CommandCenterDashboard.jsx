import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Activity, AlertTriangle, BedDouble, ChevronDown, HeartPulse, UsersRound, X } from "lucide-react";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import { initialBoard, INCOMING_PATIENTS } from "@/lib/wardBoard";
import CampusZoomMap from "@/components/dashboard/CampusZoomMap";
import RoleMissionPanel from "@/components/dashboard/RoleMissionPanel";
import { getSimulationState, subscribeSimulationState, getStaffing, subscribeStaffing } from "@/lib/simulationState";

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

function TeamContent({ staffing, running, canAssign }) {
  return <div className="pf-team-scroll">
    <p className="pf-label pf-section-label">Patient & staff <span className="pf-badge">{running ? "Simulation running" : "Idle"}</span></p>
    {staffing.length > 0 ? (
      <ul className="pf-records" aria-label="Staff on shift">
        {staffing.map(person => <li key={person.id} className="pf-record">
          <span className="pf-avatar">{person.name?.slice(0, 2).toUpperCase()}</span>
          <div className="pf-record-copy"><strong>{person.name}</strong><p>{person.dutyRole}</p>
            <span className={`pf-status ${person.status === "Available" ? "pf-status-available" : ""}`}>{person.status}</span>
          </div>
        </li>)}
      </ul>
    ) : (
      <p className="pf-muted">No staff assigned to this shift yet.{canAssign ? " Assign staffing in User Management." : ""}</p>
    )}
    <h3 className="pf-label pf-section-label">Incoming patients</h3>
    {running ? (
      <ul className="pf-records" aria-label="Incoming patients">
        {INCOMING_PATIENTS.slice(0, 3).map((patient, index) => <li key={patient.id || index} className="pf-record">
          <span className="pf-avatar"><Activity size={20} aria-hidden="true" /></span>
          <div className="pf-record-copy"><strong>{patient.name}</strong><p>{patient.condition || "Awaiting assessment"}</p>
            <span className="pf-status">Expected in {index * 4 + 3} min</span>
          </div>
        </li>)}
      </ul>
    ) : (
      <p className="pf-muted">No simulation is running — the ward is empty.</p>
    )}
  </div>;
}

export default function CommandCenterDashboard() {
  const navigate = useNavigate();
  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);
  const user = getCurrentUser();
  const canAssign = ["super_admin", "admin", "tutor"].includes(user?.role);
  const [activeZone, setActiveZone] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const teamRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const [simState, setSimState] = useState(getSimulationState);
  const [staffing, setStaffing] = useState(getStaffing);
  useEffect(() => subscribeSimulationState(setSimState), []);
  useEffect(() => subscribeStaffing(setStaffing), []);
  const running = simState.running;
  const patients = useMemo(() => running ? initialBoard(Date.now()) : [], [running]);
  const critical = useMemo(() => patients.filter(patient => (patient.initial_news2 ?? 0) >= 5), [patients]);
  const occupancy = useMemo(() => running ? Math.min(100, Math.round((patients.length / 24) * 100)) : 0, [patients, running]);

  const openDrawer = (kind, trigger) => { drawerTriggerRef.current = trigger; setDrawer(kind); };

  return <div className="pf-dashboard">
    <header className="pf-overview-heading"><h1>Pathfinder Overview</h1><DashboardClock /></header>

    <RoleMissionPanel user={user} />

    <button type="button" className="pf-mobile-summary" aria-expanded={metricsOpen} aria-controls="pf-metrics"
      onClick={() => setMetricsOpen(value => !value)}>Overview · {critical.length} alerts · {running ? `${24 - patients.length} beds available` : "ward idle"}
      <ChevronDown size={18} aria-hidden="true" /></button>
    <section id="pf-metrics" className={`pf-metrics ${metricsOpen ? "pf-metrics-open" : ""}`} aria-label="Simulation overview">
      <Metric label="Critical alerts" value={critical.length} note="Requires clinical review" icon={AlertTriangle} tone="red" />
      <Metric label="Bed availability" value={running ? `${100 - occupancy}%` : "—"} note={running ? `${24 - patients.length} of 24 beds available` : "No simulation running"} icon={BedDouble} tone="green" />
      <Metric label="Patient vitals" value={running ? "Stable" : "No simulation running"} note={running ? "Simulated observation summary" : "Ward is empty"} icon={HeartPulse} tone="blue" />
      <Metric label="Staff on shift" value={staffing.length} note={staffing.length > 0 ? `${staffing.length} assigned` : "None assigned"} icon={UsersRound} tone="sky" />
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
        <div className="pf-team-heading"><h2>Response team</h2><span className="pf-badge">{staffing.length} staff assigned</span></div>
        <TeamContent staffing={staffing} running={running} canAssign={canAssign} />
      </aside>
    </div>

    <button type="button" ref={teamRef} className="pf-team-trigger pf-primary-button"
      onClick={() => openDrawer("team", teamRef.current)}>
      <UsersRound size={21} aria-hidden="true" />Patient & staff<span className="pf-count">{staffing.length}</span>
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
          <TeamContent staffing={staffing} running={running} canAssign={canAssign} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}

