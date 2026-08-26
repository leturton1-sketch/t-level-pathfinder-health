import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { getCategoriesForRole } from "@/lib/navItems";

export default function NavCatalogSheet({ open, onOpenChange, onNavigate }) {
  const location = useLocation();
  const user = getCurrentUser();
  const categories = getCategoriesForRole(user?.role);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="clinical-glass-nav max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left font-heading">Clinical workflow</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 pb-6 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-heading font-medium transition-colors ${
              location.pathname === "/" ? "bg-primary/12 text-primary" : "text-foreground hover:bg-secondary/60"
            }`}
          >
            <Home className="h-4 w-4" /> Command Centre
          </button>
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <section key={cat.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 px-2 text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground">
                  <CatIcon className="h-3.5 w-3.5" /> {cat.label}
                </div>
                {cat.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-heading font-medium transition-colors ${
                        isActive ? "bg-primary/12 text-primary" : "text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}