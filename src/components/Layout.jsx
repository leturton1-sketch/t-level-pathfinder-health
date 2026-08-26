import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";
import GlobalVoiceControl from "./voice/GlobalVoiceControl";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";

  return (
    <div className={`clinical-global-theme min-h-screen bg-background ${isCommandCentre ? "" : "pb-16"}`}>
      <main className="min-h-screen">
        <Outlet />
      </main>
      <GlobalVoiceControl />
      {!isCommandCentre && <BottomNav />}
      {!isCommandCentre && <AIAssistant />}
    </div>
  );
}
