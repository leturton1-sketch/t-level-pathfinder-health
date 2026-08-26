import { useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/clinicalAuth";

const SECTION_LABELS = {
  "/theory": "Theory",
  "/care-planning": "Care Planning",
  "/ward-simulation": "Ward Simulation",
  "/knowledge-library": "Knowledge Library",
  "/interactive-learning": "Interactive Learning",
  "/anatomy-physiology": "Anatomy & Physiology",
  "/health-hub": "Health Hub",
  "/performance": "Performance",
  "/user-management": "User Management",
  "/scenario-authoring": "Scenario Authoring",
  "/scenario-templates": "Scenario Templates",
  "/profile": "Profile",
  "/voice-assistant": "AI Assistant",
};

function sectionFor(pathname) {
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];
  if (pathname.startsWith("/theory/")) return "Theory Module";
  if (pathname.startsWith("/care-planning")) return "Care Planning";
  return "ClinicalEdge";
}

export default function StatusBar() {
  const location = useLocation();
  const user = getCurrentUser();
  const role = user?.role ? user.role.toUpperCase() : "GUEST";

  return (
    <footer
      className="clinical-glass-nav mt-auto hidden items-center justify-between gap-4 border-t border-border px-4 py-1.5 text-[10px] font-heading uppercase tracking-wider text-muted-foreground lg:flex"
      aria-label="Application status"
    >
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-clinical-green shadow-[0_0_8px_rgba(39,122,82,.6)]" />
        Ready
      </span>
      <span className="flex items-center gap-3">
        <span>{sectionFor(location.pathname)}</span>
        <span className="opacity-50">·</span>
        <span>{role}</span>
      </span>
    </footer>
  );
}