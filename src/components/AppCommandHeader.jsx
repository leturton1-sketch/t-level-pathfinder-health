import { Home, Stethoscope, Wifi } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import TLevelLogo from "./TLevelLogo";
import { getCurrentUser } from "@/lib/clinicalAuth";

const PAGE_TITLES = {
  "/theory": ["Theory Modules", "Knowledge and curriculum"],
  "/care-planning": ["Care Planning Suite", "Clinical records and assessment"],
  "/ward-simulation": ["Ward Simulation", "Interactive clinical environment"],
  "/knowledge-library": ["Knowledge Library", "Clinical learning resources"],
  "/interactive-learning": ["Interactive Learning", "Applied learning activities"],
  "/anatomy-physiology": ["Anatomy & Pathophysiology", "Interactive body systems"],
  "/health-hub": ["Health Hub", "Health and wellbeing checks"],
  "/performance": ["Performance", "Progress and competency"],
  "/user-management": ["User Management", "Accounts and voice configuration"],
  "/scenario-authoring": ["Scenario Authoring", "Clinical simulation design"],
  "/scenario-templates": ["Scenario Templates", "Reusable clinical activities"],
  "/profile": ["User Profile", "Account and preferences"],
  "/voice-assistant": ["AI Clinical Assistant", "Conversational clinical support"],
};

function pageIdentity(pathname) {
  if (pathname.startsWith("/theory/")) return ["Theory Module", "Knowledge and curriculum"];
  if (pathname.startsWith("/care-planning/tool/")) return ["Clinical Record", "Care planning workspace"];
  if (pathname.startsWith("/care-planning/shared")) return ["Shared Care Plan", "Collaborative clinical record"];
  if (pathname.startsWith("/care-planning/abcde")) return ["ABCDE Assessment", "Structured patient assessment"];
  if (pathname.startsWith("/care-planning/news2")) return ["NEWS2", "National Early Warning Score"];
  if (pathname.startsWith("/care-planning/smart-goals")) return ["SMART Goals", "Person-centred care planning"];
  return PAGE_TITLES[pathname] || ["ClinicalEdge", "Clinical learning workspace"];
}

export default function AppCommandHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [title, context] = pageIdentity(location.pathname);

  return (
    <header className="app-command-header" aria-label="ClinicalEdge application header">
      <div className="app-command-header__identity">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="app-command-header__home"
          aria-label="Return to Clinical Command Centre"
        >
          <Home className="h-4 w-4" />
        </button>
        <span className="app-command-header__mark" aria-hidden="true">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="app-command-header__eyebrow">ClinicalEdge · Command Centre</p>
          <h1 className="app-command-header__title">{title}</h1>
          <p className="app-command-header__context">{context}</p>
        </div>
      </div>
      <div className="app-command-header__status">
        <span className="app-command-header__live">
          <Wifi className="h-3.5 w-3.5" /> Systems live
        </span>
        <span className="app-command-header__user">
          {user?.full_name || user?.username || "Clinical user"}
        </span>
        <TLevelLogo size="sm" />
      </div>
    </header>
  );
}
