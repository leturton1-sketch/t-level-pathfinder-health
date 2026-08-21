import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AIAssistant from "./AIAssistant";

export default function Layout() {
  return (
    <div className="clinical-global-theme min-h-screen bg-background pb-16">
      <main className="min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
      <AIAssistant />
    </div>
  );
}