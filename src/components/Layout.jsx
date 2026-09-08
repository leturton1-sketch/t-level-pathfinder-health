import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import PathfinderFrame from "./PathfinderFrame";
import ESPCaseBanner from "./ESPCaseBanner";
import "@/components/dashboard/pathfinder-dashboard.css";
import "@/components/pathfinder-theme.css";

export default function Layout() {
  const location = useLocation();
  const isCommandCentre = location.pathname === "/";

  useEffect(() => {
    document.body.classList.add("pf-theme-active");
    return () => document.body.classList.remove("pf-theme-active");
  }, []);

  return (
    <div className="pf-app-root">
      {isCommandCentre ? <Outlet /> : <PathfinderFrame><div className="min-h-0"><ESPCaseBanner /><Outlet /></div></PathfinderFrame>}
    </div>
  );
}