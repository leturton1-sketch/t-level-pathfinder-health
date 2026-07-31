import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import CentreLight from "@/components/CentreLight";
import TLevelLogo from "@/components/TLevelLogo";
import {
  LayoutDashboard, BookOpen, FileText, Sparkles, Stethoscope,
  Thermometer, Wrench, Settings, FlaskConical, BarChart3,
} from "lucide-react";

const MODULES = [
  { title: "Learning Dashboard", desc: "Track your progress, view completed modules, and upcoming simulations.", icon: LayoutDashboard, color: "purple", to: "/profile" },
  { title: "Performance", desc: "Visualize competency progress across all Pearson areas and knowledge checks.", icon: BarChart3, color: "blue", to: "/performance" },
  { title: "Learning Modules", desc: "Access core T-Level health curriculum, start new lessons, and take assessments.", icon: BookOpen, color: "green", to: "/theory" },
  { title: "T-Level Specification", desc: "View the official T-Level Health standards and clinical competency criteria.", icon: FileText, color: "green", to: "/knowledge-library" },
  { title: "AI Tutor", desc: "Get personalized help, ask clinical questions, and practice scenarios with AI.", icon: Sparkles, color: "purple", to: "/profile" },
  { title: "Ward Simulation", desc: "Enter the 3D interactive virtual hospital ward to practice clinical skills.", icon: Stethoscope, color: "coral", to: "/ward-simulation" },
  { title: "Clinical Skills Lab", desc: "Interactive anatomy atlas, PPE training, hazard hunts, and science flashcards.", icon: FlaskConical, color: "blue", to: "/interactive-learning" },
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
  blue: { icon: "text-blue-600", bg: "bg-blue-50", border: "hover:border-blue-300", shadow: "hover:shadow-blue-100" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
    }
  }, [navigate]);

  const visibleModules = MODULES.filter(
    (m) => !m.adminOnly || ["super_admin", "admin", "tutor"].includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
      <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto">
        {/* Top: Logo + status */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <TLevelLogo size="md" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-clinical-teal animate-pulse" />
            <span className="text-xs text-slate-500">System Online</span>
          </div>
        </div>

        {/* Centre light — flickers to life on entry */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <CentreLight />
        </div>

        {/* Electronic Whiteboard — expanded */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
          {/* Screen */}
          <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-6 sm:px-8 sm:py-10 min-h-[50vh] sm:min-h-[55vh]">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-display text-slate-800 tracking-tight uppercase">
                Unlock the Next Level of{" "}
                <span className="text-transparent" style={{ WebkitTextStroke: "1px #334155" }}>
                  Technical Education
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-3 font-body max-w-xl mx-auto leading-relaxed">
                Designed alongside leading UK employers, T Levels combine rigorous classroom learning with deep industry experience. Gain hands-on competency and prepare directly for a premium career, higher apprenticeship, or university.
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-3 font-heading tracking-wide">
                Select a learning module to launch on the display…
              </p>
            </div>

            {/* Module grid */}
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
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-800 mb-1">{module.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-tight line-clamp-2">{module.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom metallic bar — branding strip */}
          <div className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 border-t-2 border-slate-400/40 px-4 py-2 flex items-center justify-center">
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-heading tracking-widest uppercase">
              T-Level Academy · ClinicalEdge
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}