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
  { id: "A1", label: "Bay A1", status: "normal", x: 3, y: 5, w: 27, h: 28 },
  { id: "A2", label: "Bay A2", status: "normal", x: 33, y: 5, w: 28, h: 28 },
  { id: "A3", label: "Bay A3", status: "observation", x: 64, y: 5, w: 33, h: 28 },
  { id: "B1", label: "Bay B1", status: "normal", x: 3, y: 38, w: 37, h: 28 },
  { id: "B2", label: "Bay B2", status: "emergency", x: 43, y: 38, w: 25, h: 28 },
  { id: "B3", label: "Bay B3", status: "normal", x: 71, y: 38, w: 26, h: 28 },
  { id: "C1", label: "Recovery", status: "observation", x: 3, y: 71, w: 31, h: 24 },
  { id: "C2", label: "Treatment", status: "normal", x: 37, y: 71, w: 36, h: 24 },
  { id: "C3", label: "Isolation", status: "normal", x: 76, y: 71, w: 21, h: 24 },
];

const roomStyles = {
  normal: "from-emerald-300 to-teal-500 border-emerald-100/90",
  observation: "from-amber-300 to-orange-500 border-amber-100/90",
  emergency: "from-rose-400 to-red-600 border-rose-100/90",
};

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

function KpiCard({ label, value, note, icon: Icon, tone, children }) {
  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-white/70 bg-white/54 p-4 shadow-[0_18px_55px_-28px_rgba(15,60,90,.55)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/72">
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
    <button onClick={onClick} className="group relative w-full rounded-[24px] border border-white/80 bg-white/55 p-3 text-left shadow-[0_18px_32px_-22px_rgba(15,53,83,.8),inset_0_1px_1px_rgba(255,255,255,.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-cyan-500">
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
  const [selectedRoom, setSelectedRoom] = useState("B2");
  const patients = useMemo(() => initialBoard(now), []);
  const critical = patients.filter((p) => (p.news2 ?? 0) >= 5);
  const occupancy = Math.min(100, Math.round((patients.length / 24) * 100));
  const selectedPatient = patients.find((p) => p.bedDesignation === selectedRoom) || patients[0];

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const time = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_15%,rgba(125,211,252,.48),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(167,243,208,.43),transparent_28%),linear-gradient(145deg,#e8f5fa_0%,#cfe4eb_48%,#edf8f7_100%)] pb-24 text-slate-800">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-white/70 bg-white/38 px-5 py-3 shadow-[0_20px_70px_-38px_rgba(14,54,78,.7)] backdrop-blur-xl">
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

          <section className="relative min-h-[510px] overflow-hidden rounded-[34px] border border-white/75 bg-white/40 p-4 shadow-[0_35px_90px_-48px_rgba(15,53,83,.82)] backdrop-blur-2xl sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-700">Interactive ward map</p>
                <h2 className="text-lg font-black text-slate-900">Hepatica Ward · Floor 3</h2>
              </div>
              <div className="flex gap-3 text-[10px] font-bold text-slate-600">
                {["normal", "observation", "emergency"].map((s) => <span key={s} className="flex items-center gap-1.5 capitalize"><i className={`h-2.5 w-2.5 rounded-full ${s === "normal" ? "bg-emerald-500" : s === "observation" ? "bg-amber-500" : "bg-red-500"}`} />{s}</span>)}
              </div>
            </div>

            <div className="relative mx-auto h-[380px] max-w-[760px] [perspective:1100px]">
              <div className="absolute inset-[7%_5%_13%] origin-center rotate-x-[58deg] rotate-z-[-32deg] rounded-[26px] border-[10px] border-slate-100/90 bg-slate-200/80 shadow-[26px_36px_40px_-20px_rgba(15,53,83,.62)] [transform:rotateX(58deg)_rotateZ(-32deg)]">
                {ROOMS.map((room) => (
                  <button key={room.id} onClick={() => setSelectedRoom(room.id)} style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
                    className={`group absolute rounded-lg border-2 bg-gradient-to-br ${roomStyles[room.status]} shadow-[8px_10px_0_rgba(15,53,83,.18)] transition duration-300 hover:-translate-y-2 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 ${selectedRoom === room.id ? "-translate-y-2 ring-4 ring-white" : ""}`}>
                    <span className="absolute inset-x-1 top-1 rounded bg-white/78 px-1 py-0.5 text-[8px] font-black text-slate-700 shadow-sm">{room.label}</span>
                    <span className="absolute bottom-2 left-2 h-3 w-5 rounded-sm bg-white/75 shadow-[3px_3px_0_rgba(15,53,83,.18)]" />
                    <span className="absolute bottom-2 right-2 h-3 w-5 rounded-sm bg-white/75 shadow-[3px_3px_0_rgba(15,53,83,.18)]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/68 px-4 py-3 shadow-lg backdrop-blur-xl sm:left-6 sm:right-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><UserRound className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">{selectedPatient?.name || "Select a room"}</p>
                  <p className="truncate text-[10px] text-slate-500">{selectedRoom} · {selectedPatient?.condition || "Clinical bay overview"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NEWS2Badge score={selectedPatient?.news2 ?? 0} size="sm" />
                <button onClick={() => navigate("/ward-simulation")} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-cyan-700">Open ward</button>
              </div>
            </div>
          </section>

          <aside className="rounded-[30px] border border-white/75 bg-white/48 p-4 shadow-[0_26px_70px_-40px_rgba(15,53,83,.8)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-cyan-700">Response team</p><h2 className="text-base font-black text-slate-900">Patient & staff</h2></div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">{staff.length} active</span>
            </div>
            <div className="space-y-2">
              {staff.map((person) => (
                <button key={person.name} className="group flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/55 p-2.5 text-left transition hover:translate-x-1 hover:bg-white/85">
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
