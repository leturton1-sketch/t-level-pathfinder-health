import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { getNavForRole } from "@/lib/navItems";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const nav = getNavForRole(user?.role);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-nav px-3 pb-3 pointer-events-none lg:hidden">
      <nav className="clinical-glass-nav pointer-events-auto relative mx-auto max-w-md rounded-[22px] px-2 py-1.5 opacity-55 transition-[opacity,transform] duration-700 hover:opacity-95 hover:-translate-y-0.5 focus-within:opacity-100 focus-within:-translate-y-0.5">
        <div className="flex items-center justify-around">
          {nav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
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
      </nav>
    </div>
  );
}