import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import PathfinderFrame from "./PathfinderFrame";
import ESPCaseBanner from "./ESPCaseBanner";
import LearningJourney from "./LearningJourney";
import GlobalVoiceControl from "./voice/GlobalVoiceControl";
import { installGlobalUISounds } from "@/lib/uiSound";
import "@/components/dashboard/pathfinder-dashboard.css";
import "@/components/pathfinder-theme.css";
import "@/components/pathfinder-responsive.css";

export default function Layout() {

  useEffect(() => {
    document.body.classList.add("pf-theme-active");
    const removeSoundProfile = installGlobalUISounds();
    return () => {
      document.body.classList.remove("pf-theme-active");
      removeSoundProfile();
    };
  }, []);

  return (
    <div className="pf-app-root">
      <GlobalVoiceControl />
      <PathfinderFrame><div className="min-h-0"><ESPCaseBanner /><LearningJourney /><div id="learning-activity" tabIndex={-1}><Outlet /></div><LearningJourney footer /></div></PathfinderFrame>
    </div>
  );
}