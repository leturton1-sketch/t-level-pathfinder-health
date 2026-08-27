import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, ClipboardList, Stethoscope, Library, Users, User, BarChart3, GripHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/clinicalAuth";

const STORAGE_KEY = "clinicaledge_nav_pos";
const NAV_WIDTH = 448; // max-w-md approx

function defaultPosition() {
  // Bottom-center default
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
    } catch { /* ignore */ }
    return defaultPosition();
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  // Keep within viewport on resize
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

  const onPointerDown = (e) => {
    movedRef.current = false;
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { ...pos };
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
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
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const resetPosition = useCallback(() => {
    const p = defaultPosition();
    setPos(p);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }, []);

  const studentNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: ClipboardList, label: "Care Plans", path: "/care-planning" },
    { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
    { icon: BarChart3, label: "Progress", path: "/performance" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const tutorNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
    { icon: Users, label: "Users", path: "/user-management" },
    { icon: Library, label: "Library", path: "/knowledge-library" },
  ];

  const adminNav = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Users, label: "Users", path: "/user-management" },
    { icon: Library, label: "Library", path: "/knowledge-library" },
    { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  let nav;
  if (user?.role === "student") nav = studentNav;
  else if (user?.role === "tutor") nav = tutorNav;
  else nav = adminNav;

  return (
    <div
      ref={dragRef}
      className="clinical-glass-nav fixed z-40 max-w-lg rounded-[22px] px-3 py-2.5 opacity-55 transition-[opacity] duration-500 hover:opacity-95 focus-within:opacity-100 select-none"
      style={{ left: pos.x, top: pos.y, touchAction: "none", cursor: dragging ? "grabbing" : "default" }}
    >
      {/* Drag handle */}
      <button
        onPointerDown={onPointerDown}
        onDoubleClick={resetPosition}
        title="Drag to reposition · Double-click to reset"
        aria-label="Reposition navigation"
        className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-6 w-12 items-center justify-center rounded-full border border-border bg-card/90 px-2 text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-foreground hover:bg-card active:cursor-grabbing"
      >
        <GripHorizontal className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-around">
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { if (!movedRef.current) navigate(-1); }}
            title="Back"
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { if (!movedRef.current) navigate(1); }}
            title="Forward"
            aria-label="Go forward"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {nav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { if (!movedRef.current) navigate(item.path); }}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-heading font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary shadow-[0_4px_10px_rgba(118,90,176,.45)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}