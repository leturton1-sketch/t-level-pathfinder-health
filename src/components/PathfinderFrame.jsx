import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { getCurrentUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import Navigation from "@/components/dashboard/PathfinderNavigation";
import VoiceCommandControl from "@/components/voice/VoiceCommandControl";

export default function PathfinderFrame({ children }) {
  const { pathname } = useLocation();
  const user = getCurrentUser();
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1440px)").matches);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem("pathfinder-nav-collapsed") === "true"; } catch { return false; } });
  const [open, setOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem("pathfinder-nav-collapsed", String(collapsed)); } catch { /* Navigation still works without storage. */ } }, [collapsed]);
  const triggerRef = useRef(null);
  const compact = !desktop || collapsed;
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1440px)");
    const update = () => { setDesktop(query.matches); setOpen(false); };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  const openMenu = event => { triggerRef.current = event.currentTarget; setOpen(true); };
  const toggleNavByVoice = () => { if (desktop) setCollapsed(value => !value); else setOpen(value => !value); };
  return <div className={`pf-app-frame ${compact ? "pf-app-compact" : ""}`}>
    <a href="#pf-module-content" className="pf-skip-link">Skip to page content</a>
    <header className="pf-global-header">
      <button className="pf-icon-button pf-global-menu" onClick={openMenu} aria-expanded={open} aria-label="Open navigation"><Menu size={22} /></button>
      <Link to="/" className="pf-global-brand" aria-label="Pathfinder Overview">
        <img src="/branding/tl-purple.png" alt="" width="44" height="36" />
        <span><strong>Pathfinder</strong><small>T-Level Health · Simulation</small></span>
      </Link>
      <div className="pf-global-header-actions">
        <VoiceCommandControl onToggleNav={toggleNavByVoice} />
        <TLevelLogo variant="purple" size="sm" />
      </div>
    </header>
    <div className="pf-global-workspace">
      <aside className="pf-global-nav">
        <button className="pf-icon-button pf-nav-expand" aria-expanded={desktop ? !compact : open} aria-label={compact ? "Expand navigation" : "Collapse navigation"}
          onClick={event => desktop ? setCollapsed(value => !value) : openMenu(event)}>
          {compact ? <PanelLeftOpen size={22} /> : <><PanelLeftClose size={22} /><span>Collapse navigation</span></>}
        </button>
        <Navigation compact={compact} user={user} />
      </aside>
      <main id="pf-module-content" tabIndex={-1} className="pf-module" data-module={pathname.split("/")[1] || "overview"}>{children}</main>
    </div>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal><Dialog.Overlay className="pf-drawer-overlay" />
        <Dialog.Content className="pf-drawer pf-drawer-navigation" onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus(); }}>
          <div className="pf-drawer-heading"><Dialog.Title>Pathfinder navigation</Dialog.Title>
            <Dialog.Close className="pf-icon-button" aria-label="Close navigation"><X size={22} /></Dialog.Close></div>
          <Dialog.Description className="pf-drawer-description">Clinical practice, learning and account resources.</Dialog.Description>
          <div className="pf-drawer-nav"><Navigation user={user} onNavigate={() => setOpen(false)} /></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
