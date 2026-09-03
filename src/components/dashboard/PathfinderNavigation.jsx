import { useEffect, useId, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Activity, Home, BarChart3, BedDouble, BookOpen, Brain, BriefcaseMedical, ChevronDown, GraduationCap, HeartPulse, LibraryBig, Sparkles, UserCog, UserRound, FilePenLine } from "lucide-react";
import { isAdmin } from "@/lib/clinicalAuth";
export const NAVIGATION_GROUPS = [
  { label: "Overview", items: [{ label: "Pathfinder Overview", path: "/", icon: Home }] },
  { label: "Clinical practice", items: [
    { label: "3D Ward Simulation", path: "/ward-simulation", icon: BedDouble },
    { label: "Care Planning", path: "/care-planning", icon: BriefcaseMedical },
    { label: "3D Anatomy & Physiology", path: "/anatomy-physiology", icon: Brain },
  ] },
  { label: "Health & learning", items: [
    { label: "T-Level Health Hub", path: "/health-hub", icon: HeartPulse },
    { label: "Clinical Skills Academy", path: "/clinical-skills-academy", icon: GraduationCap },
    { label: "Theory Modules", path: "/theory", icon: BookOpen },
    { label: "Interactive Learning", path: "/interactive-learning", icon: Activity },
    { label: "Knowledge Library", path: "/knowledge-library", icon: LibraryBig },
  ] },
  { label: "Account & resources", items: [
    { label: "User Analytics", path: "/profile", icon: UserRound },
    { label: "Progress", path: "/performance", icon: BarChart3 },
    { label: "Pathfinder AI", path: "/voice-assistant", icon: Sparkles },
    { label: "AI Model Router", path: "/ai-models", icon: Sparkles },
  ] },
  { label: "Administration", admin: true, items: [
    { label: "User Management", path: "/user-management", icon: UserCog },
    { label: "Scenario Templates", path: "/scenario-templates", icon: FilePenLine },
    { label: "Scenario Authoring", path: "/scenario-authoring", icon: FilePenLine },
  ] },
];


export default function PathfinderNavigation({ compact = false, onNavigate, user }) {
  const { pathname } = useLocation();
  const activeGroup = NAVIGATION_GROUPS.find(group => group.items.some(item => item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)))?.label;
  const [expanded, setExpanded] = useState(["Overview", activeGroup || "Clinical practice"]);
  useEffect(() => { if (activeGroup) setExpanded(value => value.includes(activeGroup) ? value : [...value, activeGroup]); }, [activeGroup]);
  const groupPrefix = useId();
  return <nav className={`pf-navigation ${compact ? "pf-navigation-compact" : ""}`} aria-label="Primary navigation">
    {NAVIGATION_GROUPS.filter(group => !group.admin || isAdmin()).map(group => {
      const open = expanded.includes(group.label);
      return <section className="pf-nav-group" key={group.label}>
        {!compact && <button type="button" className="pf-group-toggle" aria-expanded={open}
          aria-controls={`${groupPrefix}-${group.label.replaceAll(" ", "-")}`}
          onClick={() => setExpanded(value => open ? value.filter(label => label !== group.label) : [...value, group.label])}>
          {group.label}<ChevronDown size={16} className={open ? "pf-rotated" : ""} aria-hidden="true" />
        </button>}
        {(compact || open) && <div id={compact ? undefined : `${groupPrefix}-${group.label.replaceAll(" ", "-")}`} className="pf-nav-links">
          {group.items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === "/"} onClick={onNavigate}
            className="pf-nav-link" aria-label={compact ? label : undefined} title={compact ? label : undefined}>
            <Icon size={21} aria-hidden="true" />
            {compact ? <span className="pf-nav-tooltip" aria-hidden="true">{label}</span> : <span>{label}</span>}
          </NavLink>)}
        </div>}
      </section>;
    })}
    {!compact && <div className="pf-account"><p className="pf-label">Signed in</p>
      <strong>{user?.full_name || user?.username || "Clinical user"}</strong>
      <p className="pf-muted">{user?.role?.replaceAll("_", " ") || "Team member"}</p>
    </div>}
  </nav>;
}


