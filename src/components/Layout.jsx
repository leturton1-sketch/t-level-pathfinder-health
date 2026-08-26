import { Outlet, useLocation } from "react-router-dom";
import AIAssistant from "./AIAssistant";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";
  const isVoiceAssistant = location.pathname === "/voice-assistant";

  return (
    <div className={`clinical-global-theme min-h-screen bg-background ${isCommandCentre ? "" : "app-command-surface"}`}>
      <main className="min-h-screen">
        <Outlet />
      </main>
      {!isCommandCentre && !isVoiceAssistant && <AIAssistant />}
    </div>
  );
}