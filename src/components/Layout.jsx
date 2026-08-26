import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";
import AppCommandHeader from "./AppCommandHeader";
import SideDock from "./SideDock";
import StatusBar from "./StatusBar";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";
  const isVoiceAssistant = location.pathname === "/voice-assistant";
  const showChrome = !isCommandCentre && !isVoiceAssistant;

  return (
    <div className={`clinical-global-theme flex min-h-screen flex-col bg-background ${isCommandCentre ? "" : "app-command-surface"}`}>
      {showChrome && <AppCommandHeader />}
      <div className="flex flex-1">
        {showChrome && <SideDock />}
        <main className={`flex flex-1 flex-col ${showChrome ? "pb-20 lg:pb-0" : ""}`}>
          <div className="flex-1">
            <Outlet />
          </div>
          {showChrome && <StatusBar />}
        </main>
      </div>
      {showChrome && <BottomNav />}
      {showChrome && <AIAssistant />}
    </div>
  );
}