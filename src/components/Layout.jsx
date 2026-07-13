import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";
import CallBell from "./CallBell";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <main className="min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
      <AIAssistant />
      <CallBell />
    </div>
  );
}