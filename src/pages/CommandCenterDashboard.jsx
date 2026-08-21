import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, BedDouble, BriefcaseMedical, Clock3, HeartPulse,
  ShieldCheck, Sparkles, Stethoscope, UserRound, UsersRound, Wifi,
} from "lucide-react";
import { getCurrentUser, isLoggedIn } from "@/lib/clinicalAuth";
import { initialBoard, INCOMING_PATIENTS } from "@/lib/wardBoard";
import NEWS2Badge from "@/components/NEWS2Badge";
import TLevelLogo from "@/components/TLevelLogo";

const ROOMS = [
  { id: "suite-a", label: "Clinical Suite A", shortLabel: "Suite A", status: "suiteA", x: 7, y: 8, size: 29 },
  { id: "suite-b", label: "Clinical Suite B", shortLabel: "Suite B", status: "suiteB", x: 64, y: 8, size: 29 },
  { id: "health-theory-101", label: "Health Theory 101", shortLabel: "Theory 101", status: "theory", x: 36, y: 62, size: 29 },
];

const roomStyles = {
  suiteA: "from-pink-200 via-pink-300 to-rose-400 border-pink-100/95",
  suiteB: "from-emerald-200 via-green-300 to-emerald-500 border-emerald-100/95",
  theory: "from-yellow-100 via-yellow-300 to-amber-400 border-yellow-50/95",
};

const areaLegend = [
  { label: "Corridor", colour: "bg-black" },
  { label: "Clinical Suite A", colour: "bg-pink-400" },
  { label: "Clinical Suite B", colour: "bg-emerald-500" },
  { label: "Health Theory 101", colour: "bg-yellow-400" },
];

const staff = [
  { name: "Dr Maya Chen", role: "Ward consultant", status: "Available", initials: "MC", tone: "bg-cyan-500" },
  { name: "Sam Okafor", role: "Charge nurse", status: "With patient", initials: "SO", tone: "bg-indigo-500" },
  { name: "Priya Shah", role: "Staff nurse", status: "Available", initials: "PS", tone: "bg-emerald-500" },
  { name: "Alex Morgan", role: "Healthcare assistant", status: "Break · 8 min", initials: "AM", tone: "bg-violet-500" },
];

function Sparkline() {
  return (
    <svg viewBox="0 0 120 34" className="h-8 w-full" aria-label="Patient vital trend">
      <path d="M1 23 L17 23 L23 11 L30 29 L39 18 L48 20 L57 8 L65 25 L76 21 L87 22 L96 14 L105 20 L119 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 32 L1 23 L17 23 L23 11 L30 29 L39 18 L48 20 L57 8 L65 25 L76 21 L87 22 L96 14 L105 20 L119 18 L119 32 Z" fill="currentColor" opacity=".12" />
    </svg>
  );
}

function KpiCard({ label, value, note, icon: Icon, tone, children = null }) {
  return (
    <article className="polished-glass-edge group relative overflow-hidden rounded-[22px] border border-white/80 bg-gradient-to-br from-slate-100/88 via-slate-200/72 to-slate-300/54 p-4 shadow-[0_10px_0_-5px_rgba(100,116,139,.28),0_26px_50px_-24px_rgba(15,23,42,.52),inset_1px_1px_1px_rgba(255,255,255,.95),inset_-1px_-1px_1px_rgba(71,85,105,.14)] backdrop-blur-2xl transition duration-300 before:pointer-events-none before:absolute before:-left-10 before:-top-16 before:h-28 before:w-[85%] before:rotate-[-18deg] before:rounded-full before:bg-white/65 before:blur-xl after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/90 after:to-transparent hover:-translate-y-2 hover:rotate-[.35deg] hover:shadow-[0_15px_0_-7px_rgba(100,116,139,.3),0_35px_62px_-24px_rgba(15,23,42,.58)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`rounded-2xl p-2.5 text-white shadow-lg ${tone}`}><Icon className="h-5 w-5" /></span>
      </div>
      {children}
      <p className="mt-1 text-[11px] font-medium text-slate-500">{note}</p>
    </article>
  );
}

function QuickLaunch({ icon: Icon, label, detail, onClick, tone }) {
  return (
    <button onClick={onClick} className="polished-glass-edge group relative w-full overflow-hidden rounded-[24px] border border-white/85 bg-gradient-to-br from-slate-100/90 via-slate-200/72 to-slate-300/58 p-3 text-left shadow-[0_9px_0_-4px_rgba(100,116,139,.34),0_22px_34px_-20px_rgba(15,23,42,.72),inset_1px_1px_1px_rgba(255,255,255,.95)] backdrop-blur-2xl transition duration-300 before:pointer-events-none before:absolute before:-left-8 before:-top-8 before:h-12 before:w-28 before:rotate-[-20deg] before:rounded-full before:bg-white/75 before:blur-lg hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_13px_0_-5px_rgba(100,116,139,.38),0_30px_45px_-18px_rgba(15,23,42,.78)] focus:outline-none focus:ring-2 focus:ring-cyan-500">
      <div className="flex items-center gap-3">
        <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_9px_0_-4px_rgba(15,23,42,.22),0_13px_24px_-14px_rgba(15,23,42,.75)] ${tone}`}>
          <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-extrabold text-slate-800">{label}</span>
          <span className="block truncate text-[10px] text-slate-500">{detail}</span>
        </span>
      </div>
    </button>
  );
}

export default function CommandCenterDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [now, setNow] = useState(Date.now());
  const [selectedRoom, setSelectedRoom] = useState("suite-a");
  const patients = useMemo(() => initialBoard(now), []);
  const critical = patients.filter((p) => (p.initial_news2 ?? 0) >= 5);
  const occupancy = Math.min(100, Math.round((patients.length / 24) * 100));
  const selectedPatient = patients[0];
  const selectedArea = ROOMS.find((room) => room.id === selectedRoom) || ROOMS[0];

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const time = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,.92),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(203,213,225,.70),transparent_30%),linear-gradient(145deg,#e7e9ec_0%,#c9cdd2_48%,#eef0f2_100%)] pb-24 text-slate-800">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="polished-glass-edge relative mb-5 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[26px] border border-white/85 bg-gradient-to-br from-slate-100/82 via-slate-200/64 to-slate-300/48 px-5 py-3 shadow-[0_10px_0_-5px_rgba(100,116,139,.30),0_24px_55px_-30px_rgba(15,23,42,.65),inset_1px_1px_1px_white] backdrop-blur-2xl before:pointer-events-none before:absolute before:-left-8 before:-top-10 before:h-16 before:w-2/3 before:rotate-[-5deg] before:bg-gradient-to-r before:from-white/85 before:to-transparent before:blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-700 text-white shadow-lg"><Stethoscope className="h-6 w-6" /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-700">ClinicalEdge · Live operations</p>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Clinical Command Centre</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 sm:flex"><Wifi className="h-3.5 w-3.5 text-emerald-600" /> Systems live</span>
            <span className="rounded-full bg-slate-900/85 px-3 py-1.5 font-mono text-white">{time} · {date}</span>
            <TLevelLogo size="sm" />
          </div>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Critical alerts" value={critical.length || 2} note="Requires clinical review" icon={AlertTriangle} tone="bg-gradient-to-r from-rose-500 to-red-600" />
          <KpiCard label="Bed availability" value={`${100 - occupancy}%`} note={`${24 - patients.length} of 24 beds available`} icon={BedDouble} tone="bg-gradient-to-r from-emerald-400 to-teal-600" />
          <KpiCard label="Patient vitals" value="Stable" note="Live observations · 30 sec ago" icon={HeartPulse} tone="bg-gradient-to-r from-cyan-400 to-sky-600"><div className="mt-1 text-cyan-600"><Sparkline /></div></KpiCard>
          <KpiCard label="Staff on shift" value="18" note="6 clinical · 12 ward team" icon={UsersRound} tone="bg-gradient-to-r from-indigo-400 to-violet-600" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_300px]">
          <aside className="grid grid-cols-3 gap-3 xl:block xl:space-y-3" aria-label="Quick launch">
            <QuickLaunch icon={HeartPulse} label="NEWS2" detail="Score observations" tone="bg-gradient-to-br from-rose-400 to-red-600" onClick={() => navigate("/care-planning/news2")} />
            <QuickLaunch icon={BedDouble} label="Ward Sim" detail="Open live ward" tone="bg-gradient-to-br from-cyan-400 to-sky-700" onClick={() => navigate("/ward-simulation")} />
            <QuickLaunch icon={BriefcaseMedical} label="Care plans" detail="Clinical toolkit" tone="bg-gradient-to-br from-emerald-400 to-teal-700" onClick={() => navigate("/care-planning")} />
            <div className="hidden rounded-[24px] border border-white/70 bg-slate-900/82 p-4 text-white shadow-xl backdrop-blur-xl xl:block">
              <ShieldCheck className="mb-5 h-5 w-5 text-cyan-300" />
              <p className="text-[10px] uppercase tracking-[.18em] text-slate-400">Signed in</p>
              <p className="mt-1 text-sm font-bold">{user?.full_name || user?.username || "Clinical user"}</p>
              <p className="mt-1 text-[10px] capitalize text-slate-400">{user?.role?.replace("_", " ") || "Team member"}</p>
            </div>
          </aside>

          <section className="polished-glass-edge relative min-h-[510px] overflow-hidden rounded-[34px] border border-white/90 bg-gradient-to-br from-slate-100/86 via-slate-200/65 to-slate-300/50 p-4 shadow-[0_14px_0_-7px_rgba(100,116,139,.32),0_38px_90px_-40px_rgba(15,23,42,.72),inset_1px_1px_2px_white,inset_-1px_-1px_2px_rgba(71,85,105,.16)] backdrop-blur-3xl before:pointer-events-none before:absolute before:-left-24 before:-top-20 before:h-40 before:w-3/4 before:rotate-[-12deg] before:rounded-full before:bg-white/62 before:blur-2xl sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-700">Interactive college floor plan</p>
                <h2 className="text-lg font-black text-slate-900">T Level Health Corridor</h2>
              </div>
              <div className="flex max-w-md flex-wrap justify-end gap-x-3 gap-y-1 text-[9px] font-bold text-slate-600">
                {areaLegend.map((item) => <span key={item.label} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${item.colour}`} />{item.label}</span>)}
              </div>
            </div>

            <div className="relative mx-auto h-[380px] max-w-[760px] [perspective:1350px] before:absolute before:inset-[18%_9%_7%] before:translate-y-10 before:rotate-[-4deg] before:rounded-[35%] before:bg-slate-700/24 before:blur-2xl">
              <div className="absolute inset-[7%_5%_13%] origin-center rounded-[26px] border-[11px] border-slate-100/95 bg-gradient-to-br from-slate-100/96 via-slate-300/92 to-slate-400/82 shadow-[12px_14px_0_rgba(71,85,105,.22),22px_28px_0_rgba(51,65,85,.16),35px_48px_42px_-24px_rgba(15,23,42,.72),inset_3px_3px_4px_white,inset_-3px_-3px_4px_rgba(71,85,105,.24)] [transform:rotateX(58deg)_rotateZ(-32deg)_translateZ(18px)] [transform-style:preserve-3d] before:pointer-events-none before:absolute before:inset-2 before:rounded-[18px] before:border before:border-white/75 before:bg-gradient-to-br before:from-white/30 before:via-transparent before:to-slate-500/10">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-label="Main corridor">
                  <polyline points="-4,50 15,50 31,50 48,50 65,50 82,50 104,50" fill="none" stroke="rgba(255,255,255,.82)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="-4,50 15,50 31,50 48,50 65,50 82,50 104,50" fill="none" stroke="#050706" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="pointer-events-none absolute left-[43%] top-[45%] z-30 rounded-full bg-black px-3 py-1 text-[7px] font-black uppercase tracking-[.16em] text-white shadow-lg">Corridor</span>
                {ROOMS.map((room) => (
                  <button key={room.id} onClick={() => setSelectedRoom(room.id)} style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.size}%`, aspectRatio: "1 / 1" }}
                    className={`group absolute z-10 overflow-hidden rounded-xl border-2 bg-gradient-to-br ${roomStyles[room.status]} shadow-[4px_5px_0_rgba(255,255,255,.35),10px_14px_0_rgba(15,53,83,.24),14px_20px_18px_-8px_rgba(15,23,42,.58),inset_2px_2px_2px_rgba(255,255,255,.62)] transition duration-300 before:pointer-events-none before:absolute before:-left-4 before:-top-3 before:h-7 before:w-[85%] before:rotate-[-18deg] before:rounded-full before:bg-white/58 before:blur-md hover:-translate-y-3 hover:brightness-110 hover:shadow-[5px_7px_0_rgba(255,255,255,.38),13px_19px_0_rgba(15,53,83,.28),18px_26px_24px_-10px_rgba(15,23,42,.65)] focus:outline-none focus:ring-4 focus:ring-slate-900 ${selectedRoom === room.id ? "-translate-y-3 ring-4 ring-white" : ""}`}>
                    <span className="absolute inset-x-2 top-2 rounded-md bg-white/82 px-1 py-1 text-[8px] font-black text-slate-800 shadow-sm">{room.label}</span>
                    <span className="absolute bottom-3 left-3 h-4 w-6 rounded-md bg-white/78 shadow-[3px_3px_0_rgba(15,53,83,.18)]" />
                    <span className="absolute bottom-3 right-3 h-4 w-6 rounded-md bg-white/78 shadow-[3px_3px_0_rgba(15,53,83,.18)]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="polished-glass-edge absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-br from-slate-100/92 via-slate-200/78 to-slate-300/62 px-4 py-3 shadow-[0_8px_0_-4px_rgba(100,116,139,.34),0_20px_35px_-18px_rgba(15,23,42,.62),inset_1px_1px_1px_white] backdrop-blur-2xl before:pointer-events-none before:absolute before:-left-6 before:-top-6 before:h-10 before:w-1/2 before:rotate-[-10deg] before:bg-white/70 before:blur-xl sm:left-6 sm:right-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><UserRound className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">{selectedArea.label}</p>
                  <p className="truncate text-[10px] text-slate-500">T Level Health Corridor · Selected area</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NEWS2Badge score={selectedPatient?.initial_news2 ?? 0} size="sm" />
                <button onClick={() => navigate("/ward-simulation")} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-cyan-700">Open ward</button>
              </div>
            </div>
          </section>

          <aside className="polished-glass-edge relative overflow-hidden rounded-[30px] border border-white/90 bg-gradient-to-br from-slate-100/88 via-slate-200/70 to-slate-300/54 p-4 shadow-[0_12px_0_-6px_rgba(100,116,139,.32),0_30px_62px_-30px_rgba(15,23,42,.68),inset_1px_1px_2px_white,inset_-1px_-1px_2px_rgba(71,85,105,.16)] backdrop-blur-3xl before:pointer-events-none before:absolute before:-left-10 before:-top-12 before:h-24 before:w-3/4 before:rotate-[-14deg] before:rounded-full before:bg-white/68 before:blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-cyan-700">Response team</p><h2 className="text-base font-black text-slate-900">Patient & staff</h2></div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">{staff.length} active</span>
            </div>
            <div className="space-y-2">
              {staff.map((person) => (
                <button key={person.name} className="polished-glass-edge group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-br from-slate-100/88 to-slate-300/60 p-2.5 text-left shadow-[0_5px_0_-3px_rgba(100,116,139,.3),0_12px_20px_-14px_rgba(15,23,42,.7),inset_1px_1px_1px_white] transition before:pointer-events-none before:absolute before:-left-5 before:-top-4 before:h-7 before:w-1/2 before:rotate-[-15deg] before:bg-white/65 before:blur-lg hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_8px_0_-3px_rgba(100,116,139,.32),0_18px_24px_-12px_rgba(15,23,42,.72)]">
                  <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-md ${person.tone}`}>{person.initials}<i className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{person.name}</span><span className="block truncate text-[10px] text-slate-500">{person.role}</span></span>
                  <span className="text-[9px] font-semibold text-slate-500">{person.status}</span>
                </button>
              ))}
            </div>

            <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.17em] text-slate-500">Incoming patients</p>
            <div className="space-y-2">
              {INCOMING_PATIENTS.slice(0, 3).map((patient, index) => (
                <div key={patient.id || index} className="flex items-center gap-2 rounded-2xl bg-slate-900/85 p-2.5 text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/20 text-cyan-200"><Activity className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">{patient.name}</p><p className="truncate text-[9px] text-slate-400">{patient.condition || "Awaiting assessment"}</p></div>
                  <span className="flex items-center gap-1 text-[9px] text-amber-300"><Clock3 className="h-3 w-3" />{index * 4 + 3}m</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate("/voice-assistant")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-700 px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-cyan-500/25">
              <Sparkles className="h-4 w-4" /> Ask ClinicalEdge AI
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
