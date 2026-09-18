import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";
import "./FloatingAICompanion.css";

const POSITION_KEY = "pathfinder-ai-viewport-position";
const viewport = () => ({
  width: window.visualViewport?.width || window.innerWidth,
  height: window.visualViewport?.height || window.innerHeight,
  left: window.visualViewport?.offsetLeft || 0,
  top: window.visualViewport?.offsetTop || 0,
});
const clamp = (value, max) => Math.max(8, Math.min(value, Math.max(8, max)));
export default function FloatingAICompanion({
  state = "idle", statusLabel = "Ready", expanded, onActivate, identity,
  intensity = 0.25, attentionCue, attentionKind, preview, footer, children,
}) {
  const reduced = useReducedMotion();
  const [view, setView] = useState(viewport);
  const [position, setPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY));
      return Number.isFinite(saved?.x) && Number.isFinite(saved?.y) ? saved : null;
    } catch { return null; }
  });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const root = useRef(null);
  const toggle = useRef(null);
  const previousExpanded = useRef(expanded);
  const width = Math.min(expanded ? 400 : 272, view.width - 16);
  const height = Math.min(expanded ? view.height - 16 : 300, view.height - 16);
  const x = expanded ? view.width - width - 8 : clamp(position?.x ?? view.width - width - 18, view.width - width - 8);
  const y = expanded ? 8 : clamp(position?.y ?? view.height - height - 80, view.height - height - 8);
  useEffect(() => {
    const resize = () => setView(viewport());
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
    };
  }, []);
  useEffect(() => {
    if (previousExpanded.current !== expanded) toggle.current?.focus({ preventScroll: true });
    previousExpanded.current = expanded;
  }, [expanded]);
  const save = (next) => {
    setPosition(next);
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
  };
  const endDrag = (event) => {
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const spring = reduced || dragging ? { duration: 0 } : { type: "spring", stiffness: 290, damping: 32, mass: 0.85 };
  return (
    <motion.aside ref={root} initial={false}
      animate={{ left: x + view.left, top: y + view.top, width, height, borderRadius: expanded ? 24 : 20 }}
      transition={spring}
      className={`pf-ai-viewport is-${state} ${expanded ? "is-expanded" : "is-widget"}`}
      style={{ "--pf-intensity": intensity, "--pf-ripple-duration": `${3.6 - intensity * 1.6}s` }}
      aria-label="Pathfinder AI assistant"
      onKeyDown={(event) => { if (event.key === "Escape" && expanded) { event.stopPropagation(); onActivate(); } }}
    >
      <header className="pf-ai-header">
        <button type="button" className="pf-ai-drag" disabled={expanded}
          aria-label="Move assistant widget using arrow keys or drag" title="Drag to move · Arrow keys to reposition · Home to reset"
          onPointerDown={(event) => {
            if (expanded || event.button !== 0) return;
            drag.current = { x: event.clientX, y: event.clientY, left: x, top: y };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            save({ x: clamp(drag.current.left + event.clientX - drag.current.x, view.width - width - 8),
              y: clamp(drag.current.top + event.clientY - drag.current.y, view.height - height - 8) });
          }}
          onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
          onKeyDown={(event) => {
            const moves = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
            if (event.key === "Home") { event.preventDefault(); setPosition(null); try { localStorage.removeItem(POSITION_KEY); } catch {} }
            if (!moves[event.key]) return;
            event.preventDefault();
            save({ x: clamp(x + moves[event.key][0], view.width - width - 8), y: clamp(y + moves[event.key][1], view.height - height - 8) });
          }}><GripVertical size={18} /></button>
        <div className="pf-ai-heading"><strong>Pathfinder AI</strong><span>{expanded ? identity?.fullName : "Your assistant · minimised"}</span></div>
        <button ref={toggle} type="button" className="pf-ai-toggle" onClick={onActivate}
          aria-expanded={expanded} aria-controls="pf-ai-history"
          aria-label={expanded ? "Minimise Pathfinder AI" : "Expand Pathfinder AI"}>
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </header>
      <motion.div className="pf-ai-avatar-stage" initial={false}
        animate={{ height: expanded ? (view.height < 600 ? 64 : 140) : (view.height < 400 ? 48 : 108) }} transition={spring}>
        <button type="button" className="pf-ai-avatar" onClick={onActivate} aria-label={expanded ? "Minimise assistant" : "Open full conversation"}>
          <img src="/pathfinder-educator/clinical-educator-cartoon.webp" alt="" draggable={false} />
          <span className="pf-ai-body-light" /><span className="pf-ai-body-ripple" />
          {attentionCue > 0 && <span key={attentionCue} className={`pf-ai-attention is-${attentionKind}`} />}
        </button>
        <span className="pf-ai-status" role="status" aria-live="polite">{statusLabel}</span>
      </motion.div>
      <div className="pf-ai-conversation">
        <div id="pf-ai-history" className="pf-ai-history" hidden={!expanded}>{children}</div>
        {!expanded && <p className="pf-ai-preview">{String(preview).replace(/[*#`]/g, "")}</p>}
      </div>
      <footer className="pf-ai-footer">
        <div className="pf-ai-composer">{footer}</div>
        <button type="button" className="pf-ai-ask" onClick={() => {
          root.current?.querySelector("textarea, input:not([type=file])")?.focus();
        }}>Ask Pathfinder AI</button>
      </footer>
    </motion.aside>
  );
}

