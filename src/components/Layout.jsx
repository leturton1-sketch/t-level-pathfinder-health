import { Outlet, useLocation } from "react-router-dom";
import AIAssistant from "./AIAssistant";
import { useEffect } from "react";
import PathfinderFrame from "./PathfinderFrame";
import "@/components/dashboard/pathfinder-dashboard.css";
import "@/components/pathfinder-theme.css";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";
  const isVoiceAssistant = location.pathname === "/voice-assistant";

  useEffect(() => {
    document.body.classList.add("pf-theme-active");
    return () => document.body.classList.remove("pf-theme-active");
  }, []);

  return (
    <div className="pf-app-root">
      {isCommandCentre ? <Outlet /> : <PathfinderFrame><Outlet /></PathfinderFrame>}
      {!isCommandCentre && !isVoiceAssistant && <AIAssistant />}
    </div>
  );
}