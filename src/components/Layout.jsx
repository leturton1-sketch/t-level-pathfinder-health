import { Outlet, useLocation } from "react-router-dom";
import AIAssistant from "./AIAssistant";
import { useEffect } from "react";
import PathfinderFrame from "./PathfinderFrame";
import ESPCaseBanner from "./ESPCaseBanner";
import { useESPCase } from "@/lib/ESPCaseContext";
import "@/components/dashboard/pathfinder-dashboard.css";
import "@/components/pathfinder-theme.css";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";
  const isVoiceAssistant = location.pathname === "/voice-assistant";
  const { portfolio } = useESPCase();
  const noAISupport = portfolio && ["report", "reflect", "review-plan", "update-plan", "quality-check"].includes(portfolio.active_section);

  useEffect(() => {
    document.body.classList.add("pf-theme-active");
    return () => document.body.classList.remove("pf-theme-active");
  }, []);

  return (
    <div className="pf-app-root">
      {isCommandCentre ? <Outlet /> : <PathfinderFrame><div className="min-h-0"><ESPCaseBanner /><Outlet /></div></PathfinderFrame>}
      {!isVoiceAssistant && !noAISupport && <AIAssistant />}
    </div>
  );
}