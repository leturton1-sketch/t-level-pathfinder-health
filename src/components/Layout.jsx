import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";
import GlobalVoiceControl from "./voice/GlobalVoiceControl";
import AppCommandHeader from "./AppCommandHeader";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";

  return (
    <div className={`clinical-global-theme min-h-screen bg-background ${isCommandCentre ? "" : "app-command-surface pb-16"}`}>
      {!isCommandCentre && <AppCommandHeader />}
      <main className="min-h-screen">
        <Outlet />
      </main>
      <GlobalVoiceControl />
      {!isCommandCentre && <BottomNav />}
      {!isCommandCentre && <AIAssistant />}
    </div>
  );
}
