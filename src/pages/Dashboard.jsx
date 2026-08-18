import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import StripLight3D from "@/components/dashboard/StripLight3D";
import {
  LearningCard, WardCard, CarePlanningCard, KnowledgeCard,
  PerformanceCard, InteractiveCard,
} from "@/components/dashboard/DashboardCards";
import { Search, Sparkles, Bot, Users, Settings, Activity, Stethoscope } from "lucide-react";

const ADMIN_MODULES = [
  { title: "Scenario Templates", to: "/scenario-templates", icon: Activity },
  { title: "Scenario Authoring", to: "/scenario-authoring", icon: Stethoscope },
  { title: "User Management", to: "/user-management", icon: Users },
  { title: "AI Tutor", to: "/profile", icon: Sparkles },
  { title: "AI Voice Assistant", to: "/voice-assistant", icon: Bot },
  { title: "Settings", to: "/profile", icon: Settings },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const isAdmin = ["super_admin", "admin", "tutor"].includes(user?.role);

  const cards = useMemo(() => [
    { key: "learning", title: "Learning", el: <LearningCard onNavigate={() => navigate("/theory")} /> },
    { key: "ward", title: "Ward Simulation", el: <WardCard onNavigate={() => navigate("/ward-simulation")} /> },
    { key: "care", title: "Care Planning", el: <CarePlanningCard userId={user?.id} onNavigate={() => navigate("/care-planning")} /> },
    { key: "knowledge", title: "Knowledge", el: <KnowledgeCard onNavigate={() => navigate("/knowledge-library")} /> },
    { key: "performance", title: "Performance", el: <PerformanceCard userId={user?.id} onNavigate={() => navigate("/performance")} /> },
    { key: "interactive", title: "Interactive", el: <InteractiveCard onNavigate={() => navigate("/interactive-learning")} /> },
  ], [navigate, user?.id]);

  const q = search.toLowerCase();
  const filtered = cards.filter((c) => c.title.toLowerCase().includes(q));
  const filteredAdmin = ADMIN_MODULES.filter((m) => m.title.toLowerCase().includes(q));

  return (
    <div className="min-h-screen bg-background">
      {/* Status bar */}
      <div className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-1 flex items-center justify-between text-[10px] font-heading tracking-wider uppercase">
          <span>ClinicalEdge · T Level Health</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> System Online
          </span>
        </div>
      </div>

      {/* Whiteboard header with 3D overhead strip light */}
      <div className="bg-card border-b border-border">
        <StripLight3D className="w-full h-[90px] sm:h-[110px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-2 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-1">ClinicalEdge Monitor</p>
              <h1 className="text-xl sm:text-2xl font-display text-foreground">
                Welcome back, {user?.full_name?.split(" ")[0] || "Student"}
              </h1>
            </div>
            <TLevelLogo size="md" />
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules, tools, articles…"
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal"
            />
          </div>
        </div>
      </div>

      {/* Live module whiteboard */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-[#FFA07A] to-[#FF4528]" />
          <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest">Live Module Whiteboard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((c) => (
            <div key={c.key} className="animate-slide-up">{c.el}</div>
          ))}
        </div>

        {isAdmin && filteredAdmin.length > 0 && (
          <div className="mt-8">
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest mb-3">Administration & Tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {filteredAdmin.map((m, i) => (
                <button
                  key={i}
                  onClick={() => navigate(m.to)}
                  className="group flex items-center gap-2 rounded-xl border border-border bg-card p-3 hover:border-clinical-teal/40 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFA07A] to-[#FF4528] flex items-center justify-center shrink-0">
                    <m.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-heading font-semibold text-foreground truncate">{m.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-4 flex items-center justify-between">
          <TLevelLogo size="sm" />
          <span className="text-[10px] text-muted-foreground font-heading tracking-widest uppercase">ClinicalEdge Platform</span>
        </div>
      </div>
    </div>
  );
}