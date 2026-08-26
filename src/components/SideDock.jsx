import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { getCategoriesForRole } from "@/lib/navItems";

export default function SideDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const categories = getCategoriesForRole(user?.role);

  return (
    <aside
      className="clinical-glass-nav sticky z-sticky hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border py-3 lg:flex"
      style={{ top: "var(--app-header-height)", height: "calc(100vh - var(--app-header-height))" }}
      aria-label="Primary navigation"
    >
      {categories.map((cat) => {
        const CatIcon = cat.icon;
        return (
          <div key={cat.id} className="px-2 pb-3">
            <div className="flex items-center gap-1.5 px-2 pb-1 text-[9px] font-heading font-bold uppercase tracking-wider text-muted-foreground/80">
              <CatIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {cat.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                      isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_rgba(118,90,176,.5)]" />
                    )}
                    <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
                    <span className="truncate text-[11px] font-heading font-medium leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}