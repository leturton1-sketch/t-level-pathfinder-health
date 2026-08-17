import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import {
  LayoutDashboard, BookOpen, FileText, Sparkles, Stethoscope,
  Thermometer, Wrench, Settings, FlaskConical, BarChart3, Bot,
  ChevronRight, Activity, GraduationCap, Users,
} from "lucide-react";

const MODULES = [
  { title: "Learning Dashboard", desc: "Track progress, completed modules, and upcoming simulations.", icon: LayoutDashboard, color: "purple", to: "/profile" },
  { title: "Performance", desc: "Visualise competency across all Pearson areas and knowledge checks.", icon: BarChart3, color: "blue", to: "/performance" },
  { title: "Learning Modules", desc: "Access core T Level curriculum, start lessons, and take assessments.", icon: BookOpen, color: "green", to: "/theory" },
  { title: "T Level Specification", desc: "Official T Level Health standards and clinical competency criteria.", icon: FileText, color: "green", to: "/knowledge-library" },
  { title: "AI Tutor", desc: "Personalised clinical help, question practice, and scenario coaching.", icon: Sparkles, color: "purple", to: "/profile" },
  { title: "AI Voice Assistant", desc: "Natural voice assistant with customisable voice settings.", icon: Bot, color: "blue", to: "/voice-assistant" },
  { title: "Ward Simulation", desc: "3D interactive virtual hospital ward for clinical skills practice.", icon: Stethoscope, color: "coral", to: "/ward-simulation" },
  { title: "Clinical Skills Lab", desc: "Anatomy atlas, PPE training, hazard hunts and science flashcards.", icon: FlaskConical, color: "blue", to: "/interactive-learning" },
  { title: "Care Planning Suite", desc: "ABCDE assessments, NEWS2 scoring and SMART care goals.", icon: Thermometer, color: "orange", to: "/care-planning" },
  { title: "Scenario Templates", desc: "Build reusable patient scenario templates for simulation exercises.", icon: Activity, color: "coral", to: "/scenario-templates", adminOnly: true },
  { title: "Scenario Authoring", desc: "Clone or build custom scenarios with celebrity patient profiles.", icon: Stethoscope, color: "coral", to: "/scenario-authoring", adminOnly: true },
  { title: "User Management", desc: "Manage staff and student accounts, cohorts, and permissions.", icon: Users, color: "slate", to: "/user-management", adminOnly: true },
  { title: "System Settings", desc: "Manage your profile, roles, and application preferences.", icon: Settings, color: "slate", to: "/profile" },
];

const COLOR_STYLES = {
  purple: { icon: "text-[#7B61C4]", bg: "bg-[#7B61C4]/10", hover: "hover:border-[#7B61C4]/50 hover:bg-[#7B61C4]/5" },
  green:  { icon: "text-[#F4845F]", bg: "bg-[#F4845F]/10", hover: "hover:border-[#F4845F]/50 hover:bg-[#F4845F]/5" },
  coral:  { icon: "text-[#F03D1C]", bg: "bg-[#F03D1C]/10", hover: "hover:border-[#F03D1C]/40 hover:bg-[#F03D1C]/5" },
  orange: { icon: "text-[#F4845F]", bg: "bg-[#F4845F]/10", hover: "hover:border-[#F4845F]/50 hover:bg-[#F4845F]/5" },
  slate:  { icon: "text-slate-500",  bg: "bg-slate-100",    hover: "hover:border-slate-400 hover:bg-slate-50" },
  blue:   { icon: "text-[#7B61C4]", bg: "bg-[#7B61C4]/10", hover: "hover:border-[#7B61C4]/50 hover:bg-[#7B61C4]/5" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const visibleModules = MODULES.filter(
    (m) => !m.adminOnly || ["super_admin", "admin", "tutor"].includes(user?.role)
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0D1526 0%, #1a2540 50%, #0D1526 100%)" }}>
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <TLevelLogo size="md" dark variant="white" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F4845F] animate-pulse" />
            <span className="text-xs text-slate-400 font-heading">System Online</span>
          </div>
        </div>

        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden mb-6 sm:mb-8" style={{ background: "linear-gradient(135deg, #F4845F 0%, #F03D1C 100%)" }}>
          <div className="px-6 py-8 sm:px-10 sm:py-10 relative">
            {/* Decorative TL mark */}
            <div className="absolute right-4 top-4 opacity-10 select-none pointer-events-none">
              <img src="https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/eb340c16e_TLevel-Logo-TLWhite.png"
                alt="" className="h-32 w-auto" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <p className="text-white/80 text-xs font-heading uppercase tracking-widest mb-2">ClinicalEdge · T Level Health</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display text-white leading-tight mb-3">
                The Next Level<br />of Clinical Education
              </h1>
              <p className="text-white/80 text-sm leading-relaxed font-body">
                Combining rigorous classroom learning with deep industry experience.
                Gain hands-on clinical competency and prepare for a premium career in healthcare.
              </p>
              {user && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-1.5">
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-heading font-semibold capitalize">
                    {user.full_name || user.username} · {user.role}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module grid */}
        <div className="mb-3">
          <p className="text-xs text-slate-400 font-heading uppercase tracking-widest mb-4">Select a module to launch</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {visibleModules.map((module, idx) => {
              const style = COLOR_STYLES[module.color];
              return (
                <button
                  key={idx}
                  onClick={() => navigate(module.to)}
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:bg-white/10 ${style.hover} animate-slide-up`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                    <module.icon className={`w-5 h-5 ${style.icon}`} />
                  </div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-white mb-1 leading-snug">{module.title}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 leading-tight line-clamp-2 mb-2">{module.desc}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#F4845F] transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer brand strip */}
        <div className="mt-8 border-t border-white/10 pt-4 flex items-center justify-between">
          <img src="https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/e326bdc6f_TLevel-Logo-WhiteWithStrapline.png"
            alt="T Levels" className="h-6 w-auto opacity-60" />
          <span className="text-[10px] text-slate-500 font-heading tracking-widest uppercase">ClinicalEdge Platform</span>
        </div>
      </div>
    </div>
  );
}