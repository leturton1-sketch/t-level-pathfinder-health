import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./FloatingAICompanion.css";

const POSITION_KEY = "pathfinder-clinical-ai-companion-position";
const MINIMIZED_KEY = "pathfinder-clinical-ai-companion-minimized";
const MARGIN = 12;
const SNAP_DISTANCE = 48;
const FULL_SIZE = { width: 104, height: 220 };
const MINI_SIZE = { width: 52, height: 110 };

function loadPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY));
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {}
  return null;
}

function loadMinimized() {
  try { return localStorage.getItem(MINIMIZED_KEY) === "true"; } catch { return false; }
}

function dockPosition(minimized) {
  const size = minimized ? MINI_SIZE : FULL_SIZE;
  return {
    x: Math.max(MARGIN, window.innerWidth - size.width - MARGIN),
    y: Math.max(MARGIN, window.innerHeight - size.height - MARGIN),
  };
}

export default function FloatingAICompanion({
  state = "idle",
  expanded = false,
  attentionCue = 0,
  attentionKind = "none",
  onActivate,
}) {
  const { pathname } = useLocation();
  const widgetRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const clickTimerRef = useRef(null);
  const savedPositionRef = useRef(loadPosition());
  const customPositionRef = useRef(Boolean(savedPositionRef.current));
  const positionRef = useRef(savedPositionRef.current);
  const [position, setPositionState] = useState(positionRef.current);
  const [minimized, setMinimized] = useState(loadMinimized);

  const setPosition = (next) => {
    positionRef.current = next;
    setPositionState(next);
  };

  useEffect(() => () => window.clearTimeout(clickTimerRef.current), []);

  useEffect(() => {
    if (!customPositionRef.current) setPosition(dockPosition(minimized));
  }, [pathname, minimized]);

  useEffect(() => {
    const clamp = () => {
      if (!positionRef.current) return;
      const size = minimized ? MINI_SIZE : FULL_SIZE;
      const current = positionRef.current;
      const next = {
        x: Math.max(MARGIN, Math.min(current.x, window.innerWidth - size.width - MARGIN)),
        y: Math.max(MARGIN, Math.min(current.y, window.innerHeight - size.height - MARGIN)),
      };
      if (next.x !== current.x || next.y !== current.y) setPosition(next);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [minimized]);

  const snapToNearbyEdge = (point, minimizedState = minimized) => {
    const size = minimizedState ? MINI_SIZE : FULL_SIZE;
    const maxX = Math.max(MARGIN, window.innerWidth - size.width - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - size.height - MARGIN);
    const edges = [
      { axis: "x", value: MARGIN, distance: Math.abs(point.x - MARGIN) },
      { axis: "x", value: maxX, distance: Math.abs(point.x - maxX) },
      { axis: "y", value: MARGIN, distance: Math.abs(point.y - MARGIN) },
      { axis: "y", value: maxY, distance: Math.abs(point.y - maxY) },
    ].filter((edge) => edge.distance <= SNAP_DISTANCE);
    return edges.reduce((next, edge) => ({ ...next, [edge.axis]: edge.value }), point);
  };

  const onPointerDown = (event) => {
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    movedRef.current = false;
    widgetRef.current.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const size = minimized ? MINI_SIZE : FULL_SIZE;
    const next = {
      x: Math.max(MARGIN, Math.min(event.clientX - dragRef.current.dx, window.innerWidth - size.width - MARGIN)),
      y: Math.max(MARGIN, Math.min(event.clientY - dragRef.current.dy, window.innerHeight - size.height - MARGIN)),
    };
    const current = positionRef.current || widgetRef.current.getBoundingClientRect();
    if (Math.abs(next.x - current.x) > 3 || Math.abs(next.y - current.y) > 3) movedRef.current = true;
    setPosition(next);
  };

  const onPointerUp = (event) => {
    if (!dragRef.current) return;
    try { widgetRef.current?.releasePointerCapture?.(event.pointerId); } catch {}
    dragRef.current = null;
    if (movedRef.current) {
      const snapped = snapToNearbyEdge(positionRef.current || dockPosition(minimized));
      customPositionRef.current = true;
      setPosition(snapped);
      localStorage.setItem(POSITION_KEY, JSON.stringify(snapped));
      return;
    }
    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => onActivate?.(), 220);
  };

  const toggleMinimized = () => {
    window.clearTimeout(clickTimerRef.current);
    const nextMinimized = !minimized;
    const nextPosition = customPositionRef.current
      ? snapToNearbyEdge(positionRef.current || dockPosition(nextMinimized), nextMinimized)
      : dockPosition(nextMinimized);
    setMinimized(nextMinimized);
    setPosition(nextPosition);
    localStorage.setItem(MINIMIZED_KEY, String(nextMinimized));
    if (customPositionRef.current) localStorage.setItem(POSITION_KEY, JSON.stringify(nextPosition));
  };

  const onDoubleClick = (event) => {
    event.preventDefault();
    toggleMinimized();
  };

  const style = position
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : undefined;
  return (
    <div
      ref={widgetRef}
      className={`ai-companion-container educator-companion is-${state}${minimized ? " is-minimized" : ""}${expanded ? " is-expanded" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={expanded ? "Close Pathfinder Clinical Educator" : "Open Pathfinder Clinical Educator"}
      aria-expanded={expanded}
      title={`${expanded ? "Click to close" : "Click to open"} · Drag to move · Double-click to resize`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate?.();
        }
      }}
    >
      <div className="educator-companion-visual" aria-hidden="true">
        <span className="educator-companion-glow" />
        <img
          className="educator-companion-image"
          src="/pathfinder-educator/clinical-educator-cartoon.webp"
          alt=""
          draggable={false}
        />
        <img
          className="educator-companion-echo"
          src="/pathfinder-educator/clinical-educator-cartoon.webp"
          alt=""
          draggable={false}
        />
        <span className="educator-companion-scanline" />
        <span className="educator-companion-distortion distortion-a" />
        <span className="educator-companion-distortion distortion-b" />
        <span className="educator-feature-light educator-eye-light educator-eye-light-left" />
        <span className="educator-feature-light educator-eye-light educator-eye-light-right" />
        <span className="educator-feature-light educator-rune-light educator-rune-light-left" />
        <span className="educator-feature-light educator-rune-light educator-rune-light-right" />
        <span className="widget-stethoscope-pulse" />
        <svg className="widget-heartbeat" viewBox="0 0 100 22" preserveAspectRatio="none"><polyline points="0,12 21,12 27,5 33,18 40,2 47,19 54,12 100,12" /></svg>
        <span className="widget-dna"><i /><i /><i /><i /><i /><i /><b>DNA</b></span>
        <span className="widget-complete"><i /><strong>✓</strong><b>Task complete</b></span>
        <span className="widget-rest"><i /><i /><i /><b>Standby</b></span>
        {attentionCue > 0 && (
          <span
            key={attentionCue}
            className={`educator-companion-attention is-${attentionKind}`}
          />
        )}
      </div>
    </div>
  );
}
