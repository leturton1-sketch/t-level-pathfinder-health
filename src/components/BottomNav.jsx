import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, BedDouble, BookOpen, Brain, BriefcaseMedical, ChevronRight, ClipboardCheck, GripHorizontal,
  HeartPulse, Home, Library, User, Users, X,
} from "lucide-react";
import { getCurrentUser } from "@/lib/clinicalAuth";

const STORAGE_KEY = "clinicaledge_nav_pos";
const NAV_WIDTH = 448;

const PRACTICE_DESTINATIONS = [
  {
    icon: ClipboardCheck,
    label: "ESP Practice Hub",
    detail: "Complete the four linked employer-set project tasks",
    path: "/esp-practice",
    tone: "from-violet-500 to-fuchsia-700",
  },
  {
    icon: BedDouble,
    label: "3D Ward Simulation",
    detail: "Enter the interactive clinical ward",
    path: "/ward-simulation",
    tone: "from-cyan-400 to-sky-700",
  },
  {
    icon: BriefcaseMedical,
    label: "Care Planning",
    detail: "Open assessments and care records",
    path: "/care-planning",
    tone: "from-emerald-400 to-teal-700",
  },
  {
    icon: Brain,
    label: "3D Anatomy & Physiology",
    detail: "Explore interactive body systems",
    path: "/anatomy-physiology",
    tone: "from-violet-400 to-fuchsia-700",
  },
];

function defaultPosition() {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const x = Math.max(12, (vw - NAV_WIDTH) / 2);
  const y = vh - 96;
  return { x, y };
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Use the safe default position when stored data is unavailable.
    }
    return defaultPosition();
  });
  const [dragging, setDragging] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const el = dragRef.current;
        const w = el?.offsetWidth || NAV_WIDTH;
        const h = el?.offsetHeight || 64;
        return {
          x: Math.min(Math.max(8, prev.x), Math.max(8, vw - w - 8)),
          y: Math.min(Math.max(8, prev.y), Math.max(8, vh - h - 8)),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setPracticeOpen(false);
  }, [location.pathname]);

  const onPointerDown = (event) => {
    movedRef.current = false;
    setDragging(true);
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...pos };
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const el = dragRef.current;
      const w = el?.offsetWidth || NAV_WIDTH;
      const h = el?.offsetHeight || 64;
      setPos({
        x: Math.min(Math.max(8, origin.x + dx), Math.max(8, vw - w - 8)),
        y: Math.min(Math.max(8, origin.y + dy), Math.max(8, vh - h - 8)),
      });
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    if (dragging) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // Position persistence is a convenience only.
    }
  }, [dragging, pos]);

  const resetPosition = useCallback(() => {
    const nextPosition = defaultPosition();
    setPos(nextPosition);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosition));
    } catch {
      // Position persistence is a convenience only.
    }
  }, []);

  const studentNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: HeartPulse, label: "Practice", type: "practice" },
    { icon: BarChart3, label: "Progress", path: "/performance" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const tutorNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: HeartPulse, label: "Practice", type: "practice" },
    { icon: Users, label: "Users", path: "/user-management" },
    { icon: Library, label: "Library", path: "/knowledge-library" },
  ];

  const adminNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: HeartPulse, label: "Practice", type: "practice" },
    { icon: Users, label: "Users", path: "/user-management" },
    { icon: Library, label: "Library", path: "/knowledge-library" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  let nav;
  if (user?.role === "student") nav = studentNav;
  else if (user?.role === "tutor") nav = tutorNav;
  else nav = adminNav;

  const practiceActive = PRACTICE_DESTINATIONS.some(({ path }) => location.pathname.startsWith(path));

  return (
    <>
      {practiceOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setPracticeOpen(false)}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="clinical-practice-menu-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[26px] border border-white/90 bg-gradient-to-br from-slate-100/96 via-slate-200/94 to-slate-300/90 p-4 shadow-[0_28px_70px_-25px_rgba(15,23,42,.72),inset_1px_1px_2px_white] backdrop-blur-3xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700">Main menu</p>
                <h2 id="clinical-practice-menu-title" className="text-lg font-black text-slate-950">Clinical Practice</h2>
              </div>
              <button
                type="button"
                onClick={() => setPracticeOpen(false)}
                aria-label="Close clinical practice menu"
                className="no-clay grid h-11 w-11 place-items-center rounded-xl border border-white bg-white/85 text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2" aria-label="Clinical practice destinations">
              {PRACTICE_DESTINATIONS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`no-clay group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500 ${isActive ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200" : "border-white/95 bg-white/85 hover:-translate-y-0.5 hover:bg-white"}`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-slate-900">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#4A5568]">{item.detail}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </nav>
          </section>
        </div>
      )}

      <div
        ref={dragRef}
        className="clinical-glass-nav fixed z-40 max-w-lg select-none rounded-[22px] px-2 py-2.5 opacity-80 shadow-xl transition-[opacity] duration-300 hover:opacity-100 focus-within:opacity-100"
        style={{ left: pos.x, top: pos.y, maxWidth: "min(32rem, calc(100vw - 16px))", touchAction: "none", cursor: dragging ? "grabbing" : "default" }}
      >
        <button
          onPointerDown={onPointerDown}
          onDoubleClick={resetPosition}
          title="Drag to reposition · Double-click to reset"
          aria-label="Reposition navigation"
          className="absolute -top-3 left-1/2 flex h-6 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card/90 px-2 text-muted-foreground shadow-md backdrop-blur transition-colors hover:bg-card hover:text-foreground active:cursor-grabbing"
        >
          <GripHorizontal className="h-4 w-4" />
        </button>

        <nav className="flex items-stretch justify-around gap-0.5" aria-label="Main navigation">
          {nav.map((item) => {
            const isPractice = item.type === "practice";
            const isActive = isPractice ? practiceActive : location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path || item.type}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  if (movedRef.current) return;
                  if (isPractice) setPracticeOpen(true);
                  else navigate(item.path);
                }}
                aria-label={item.label}
                aria-expanded={isPractice ? practiceOpen : undefined}
                className={`relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 ${isActive ? "bg-violet-50/85 text-primary" : "text-muted-foreground hover:bg-white/60 hover:text-foreground"}`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span className="block text-[9px] font-heading font-bold leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_4px_10px_rgba(118,90,176,.45)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
