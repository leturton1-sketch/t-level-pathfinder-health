import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { getNavForRole } from "@/lib/navItems";

export default function SideDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const nav = getNavForRole(user?.role);

  return (
    <aside
      className="clinical-glass-nav sticky z-sticky hidden w-20 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border py-4 lg:flex"
      style={{ top: "var(--app-header-height)", height: "calc(100vh - var(--app-header-height))" }}
      aria-label="Primary navigation"
    >
      {nav.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex w-16 flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-all ${
              isActive ? "text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_rgba(118,90,176,.5)]" />
            )}
            <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
            <span className="text-[10px] font-heading font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}