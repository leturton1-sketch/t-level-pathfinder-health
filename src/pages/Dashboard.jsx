import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import OverheadLight from "@/components/OverheadLight";
import {
  LayoutDashboard, BookOpen, FileText, Sparkles, Stethoscope,
  Thermometer, Wrench, Settings, Highlighter, Eraser, StickyNote,
  Undo2, Redo2,
} from "lucide-react";

const MODULES = [
  { title: "Learning Dashboard", desc: "Track your progress, view completed modules, and upcoming simulations.", icon: LayoutDashboard, color: "purple", to: "/profile" },
  { title: "Learning Modules", desc: "Access core T-Level health curriculum, start new lessons, and take assessments.", icon: BookOpen, color: "green", to: "/theory" },
  { title: "T-Level Specification", desc: "View the official T-Level Health standards and clinical competency criteria.", icon: FileText, color: "green", to: "/knowledge-library" },
  { title: "AI Tutor", desc: "Get personalized help, ask clinical questions, and practice scenarios with AI.", icon: Sparkles, color: "purple", to: "/profile" },
  { title: "Ward Simulation", desc: "Enter the 3D interactive virtual hospital ward to practice clinical skills.", icon: Stethoscope, color: "coral", to: "/ward-simulation" },
  { title: "Care Planning Suite", desc: "Complete ABCDE assessments, NEWS2 scoring, and SMART care goals.", icon: Thermometer, color: "orange", to: "/care-planning" },
  { title: "User Management", desc: "Manage staff and student accounts, cohorts, and access permissions.", icon: Wrench, color: "slate", to: "/user-management", adminOnly: true },
  { title: "System Settings", desc: "Manage your profile, change active roles, and configure application preferences.", icon: Settings, color: "slate", to: "/profile" },
];

const COLOR_STYLES = {
  purple: { icon: "text-purple-600", bg: "bg-purple-50", border: "hover:border-purple-300", shadow: "hover:shadow-purple-100" },
  green: { icon: "text-clinical-teal", bg: "bg-clinical-teal/10", border: "hover:border-clinical-teal/40", shadow: "hover:shadow-green-100" },
  coral: { icon: "text-rose-500", bg: "bg-rose-50", border: "hover:border-rose-300", shadow: "hover:shadow-rose-100" },
  orange: { icon: "text-orange-500", bg: "bg-orange-50", border: "hover:border-orange-300", shadow: "hover:shadow-orange-100" },
  slate: { icon: "text-slate-600", bg: "bg-slate-100", border: "hover:border-slate-400", shadow: "hover:shadow-slate-200" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [booting, setBooting] = useState(true);
  const [highlightMode, setHighlightMode] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setBooting(false), 600);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (booting) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center"><OverheadLight /></div>
          <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">Initialising clinical dashboard…</p>
        </div>
      </div>
    );
  }

  const visibleModules = MODULES.filter(
    (m) => !m.adminOnly || ["super_admin", "admin", "tutor"].includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
      <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Welcome, {user?.full_name?.split(" ")[0] || "User"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-clinical-teal animate-pulse" />
            <span className="text-xs text-slate-500">System Online</span>
          </div>
        </div>

        {/* Electronic Whiteboard */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
          {/* Screen */}
          <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-6 sm:px-8 sm:py-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-clinical-teal tracking-tight">
                T Level Health
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-600 mt-1 font-medium">
                Supporting the Adult Nursing Team
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Select a learning module to launch on the display…
              </p>
            </div>

            {/* Module grid 4×2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
              {visibleModules.map((module, idx) => {
                const style = COLOR_STYLES[module.color];
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(module.to)}
                    className={`group relative bg-white rounded-xl border border-slate-200 p-3 sm:p-4 text-center transition-all duration-200 hover:-translate-y-1 ${style.border} ${style.shadow} hover:shadow-lg animate-slide-up`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl ${style.bg} flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110`}>
                      <module.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.icon}`} />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-1">{module.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-tight line-clamp-2">{module.desc}</p>
                    {highlightMode && (
                      <div className="absolute inset-0 rounded-xl bg-yellow-300/20 border-2 border-yellow-300/60 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom metallic control bar */}
          <div className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 border-t-2 border-slate-400/40 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setHighlightMode(!highlightMode)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all active:scale-95 ${
                highlightMode
                  ? "bg-yellow-400 text-slate-800 shadow-sm"
                  : "bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200"
              }`}
            >
              <Highlighter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">HIGHLIGHTER</span>
            </button>

            <button
              onClick={() => setHighlightMode(false)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 transition-all active:scale-95"
            >
              <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">CLEAR</span>
            </button>

            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">NOTES</span>
            </button>

            <div className="w-px h-6 bg-slate-400/40 mx-0.5 sm:mx-1" />

            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">UNDO</span>
            </button>

            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">REDO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}