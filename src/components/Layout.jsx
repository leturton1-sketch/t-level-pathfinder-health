import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import PathfinderFrame from "./PathfinderFrame";
import ESPCaseBanner from "./ESPCaseBanner";
import LearningJourney from "./LearningJourney";
import GlobalVoiceControl from "./voice/GlobalVoiceControl";
import "@/components/dashboard/pathfinder-dashboard.css";
import "@/components/pathfinder-theme.css";

export default function Layout() {

  useEffect(() => {
    document.body.classList.add("pf-theme-active");
    return () => document.body.classList.remove("pf-theme-active");
  }, []);

  return (
    <div className="pf-app-root">
      <GlobalVoiceControl />
      <PathfinderFrame><div className="min-h-0"><ESPCaseBanner /><LearningJourney /><div id="learning-activity" tabIndex={-1}><Outlet /></div><LearningJourney footer /></div></PathfinderFrame>
    </div>
  );
}