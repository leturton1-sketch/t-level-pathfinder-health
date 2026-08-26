import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";
import AppCommandHeader from "./AppCommandHeader";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";
  const isVoiceAssistant = location.pathname === "/voice-assistant";

  return (
    <div className={`clinical-global-theme min-h-screen bg-background ${isCommandCentre ? "" : "app-command-surface pb-16"}`}>
      {!isCommandCentre && <AppCommandHeader />}
      <main className="min-h-screen">
        <Outlet />
      </main>
      {!isCommandCentre && !isVoiceAssistant && <BottomNav />}
      {!isCommandCentre && !isVoiceAssistant && <AIAssistant />}
    </div>
  );
}
