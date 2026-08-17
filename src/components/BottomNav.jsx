import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, ClipboardList, Stethoscope, Library, Users, User, BarChart3 } from "lucide-react";
import { getCurrentUser } from "@/lib/clinicalAuth";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10"
      style={{ background: "linear-gradient(180deg, rgba(13,21,38,0.97) 0%, #0D1526 100%)", backdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-around px-2 py-1.5 max-w-2xl mx-auto">
        {nav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? "text-[#F4845F]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-heading font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F4845F]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}