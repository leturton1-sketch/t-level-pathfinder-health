import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Calculator, Check, ConciergeBell, Dumbbell, HeartPulse, MapPin, PawPrint,
  Pencil, RotateCcw, Save, UtensilsCrossed, X,
} from "lucide-react";

const STORAGE_KEY = "clinicaledge-campus-pin-layout-v1";
const DEFAULT_HOTSPOTS = [
  {
    id: "health",
    label: "Health Department",
    detail: "T Level Health Provision",
    x: 50,
    y: 41.5,
    scale: 2.6,
    filters: ["suite-a", "suite-b"],
    icon: HeartPulse,
    colour: "from-pink-500 to-rose-600",
  },
  {
    id: "reception",
    label: "Reception",
    detail: "Main campus reception and visitor arrival",
    x: 33,
    y: 48,
    scale: 2.4,
    filters: ["reception"],
    icon: ConciergeBell,
    colour: "from-violet-500 to-indigo-700",
  },
  {
    id: "animal-care",
    label: "Animal Care & Management Department",
    detail: "Animal care teaching and practical facilities",
    x: 24,
    y: 70,
    scale: 2.25,
    filters: ["animal-care"],
    icon: PawPrint,
    colour: "from-emerald-500 to-green-700",
  },
  {
    id: "refectory",
    label: "Refectory",
    detail: "Campus dining and social space",
    x: 46,
    y: 34,
    scale: 2.3,
    filters: ["refectory"],
    icon: UtensilsCrossed,
    colour: "from-orange-400 to-amber-600",
  },
  {
    id: "sport",
    label: "Sport Department",
    detail: "Sport teaching and training facilities",
    x: 70,
    y: 65,
    scale: 2.2,
    filters: ["sport"],
    icon: Dumbbell,
    colour: "from-blue-500 to-cyan-700",
  },
  {
    id: "english-maths",
    label: "English & Mathematics Department",
    detail: "English and mathematics learning centre",
    x: 56,
    y: 49,
    scale: 2.35,
    filters: ["english-maths"],
    icon: Calculator,
    colour: "from-fuchsia-500 to-purple-700",
  },
];

function clamp(value) {
  return Math.min(96, Math.max(4, Number(value) || 0));
}

function CampusZoomMap({ activeZone = "all", onZoneChange }) {
  const [hotspots, setHotspots] = useState(DEFAULT_HOTSPOTS);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editSpotId, setEditSpotId] = useState("health");
  const [draggingId, setDraggingId] = useState(null);
  const mapRef = useRef(null);
  const editBaselineRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggedRef = useRef(false);

  useEffect(() => {
    try {
      const savedRecord = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || "null",
      );
      const saved = Array.isArray(savedRecord) ? savedRecord : savedRecord?.positions;
      if (!Array.isArray(saved)) return;
      setHotspots((current) => current.map((spot) => {
        const position = saved.find((item) => item.id === spot.id);
        return position ? { ...spot, x: clamp(position.x), y: clamp(position.y) } : spot;
      }));
    } catch {
      // Keep safe defaults when stored layout data is invalid.
    }
  }, []);

  const selected = useMemo(
    () => hotspots.find((spot) => spot.id === selectedId),
    [hotspots, selectedId],
  );
  const editSpot = hotspots.find((spot) => spot.id === editSpotId) || hotspots[0];

  useEffect(() => {
    if (editing) return;
    if (activeZone === "all") { setSelectedId(null); return; }
    const filteredHotspot = hotspots.find((spot) => spot.filters.includes(activeZone));
    if (filteredHotspot) setSelectedId(filteredHotspot.id);
  }, [activeZone, editing, hotspots]);

  const focusHotspot = (spot) => {
    if (!editing) setSelectedId(spot.id);
  };

  const resetZoom = () => {
    setSelectedId(null);
    onZoneChange?.("all");
  };

  const openEditor = () => {
    editBaselineRef.current = hotspots.map((spot) => ({ id: spot.id, x: spot.x, y: spot.y }));
    setSelectedId(null);
    setEditing(true);
  };

  const closeEditor = () => {
    if (editBaselineRef.current) {
      setHotspots((current) => current.map((spot) => {
        const position = editBaselineRef.current.find((item) => item.id === spot.id);
        return position ? { ...spot, x: position.x, y: position.y } : spot;
      }));
    }
    editBaselineRef.current = null;
    setDraggingId(null);
    setEditing(false);
  };

  const updatePosition = (id, axis, value) => {
    setHotspots((current) => current.map((spot) => (
      spot.id === id ? { ...spot, [axis]: Math.round(clamp(value) * 10) / 10 } : spot
    )));
  };

  const savePositions = () => {
    const positions = hotspots.map(({ id, x, y }) => ({ id, x, y }));
    const payload = JSON.stringify({ version: 2, savedAt: new Date().toISOString(), positions });
    try {
      localStorage.setItem(STORAGE_KEY, payload);
      sessionStorage.setItem(STORAGE_KEY, payload);
    } catch {
      sessionStorage.setItem(STORAGE_KEY, payload);
    }
    editBaselineRef.current = null;
    setEditing(false);
    setDraggingId(null);
  };

  const restoreDefaults = () => {
    setHotspots(DEFAULT_HOTSPOTS);
    setEditSpotId("health");
  };

  const positionFromPointer = (event, offset = { x: 0, y: 0 }) => {
    if (!mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left - offset.x) / rect.width) * 100,
      y: ((event.clientY - rect.top - offset.y) / rect.height) * 100,
    };
  };

  const moveDraggedPin = (event) => {
    if (!editing || !draggingId) return;
    const position = positionFromPointer(event, dragOffsetRef.current);
    if (!position) return;
    draggedRef.current = true;
    updatePosition(draggingId, "x", position.x);
    updatePosition(draggingId, "y", position.y);
  };

  const placeSelectedPin = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const isInteractiveOverlay = target?.closest(".campus-hotspot, .campus-map-controls");
    if (!editing || draggedRef.current || isInteractiveOverlay) {
      draggedRef.current = false;
      return;
    }
    const position = positionFromPointer(event);
    if (!position) return;
    updatePosition(editSpotId, "x", position.x);
    updatePosition(editSpotId, "y", position.y);
  };

  const nudgePin = (event, spot) => {
    if (!editing || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 1 : 0.1;
    if (event.key === "ArrowLeft") updatePosition(spot.id, "x", spot.x - step);
    if (event.key === "ArrowRight") updatePosition(spot.id, "x", spot.x + step);
    if (event.key === "ArrowUp") updatePosition(spot.id, "y", spot.y - step);
    if (event.key === "ArrowDown") updatePosition(spot.id, "y", spot.y + step);
  };

  const mapStyle = selected && !editing
    ? {
        transformOrigin: `${selected.x}% ${selected.y}%`,
        transform: `scale(${selected.scale})`,
      }
    : { transformOrigin: "50% 50%", transform: "scale(1)" };

  return (
    <div className="campus-map-shell relative mx-auto w-full max-w-[720px]">
      <div className="pf-map-viewport">
      <div className="campus-map-controls relative z-40 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/95 bg-white/90 p-2 shadow-[0_12px_30px_-18px_rgba(15,23,42,.7)] backdrop-blur-xl">
        <label className="pf-map-filter">
          <span className="sr-only">Filter campus departments</span>
          <select aria-label="Filter campus departments" value={activeZone} disabled={editing}
            onChange={(event) => onZoneChange?.(event.target.value)}>
            <option value="all">All departments</option>
            <option value="suite-a">Health Department</option>
            <option value="reception">Reception</option>
            <option value="animal-care">Animal Care & Management</option>
            <option value="refectory">Refectory</option>
            <option value="sport">Sport Department</option>
            <option value="english-maths">English & Mathematics</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          {!editing && (
            <button type="button" onClick={openEditor} className="no-clay flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-[10px] font-bold text-violet-800 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <Pencil className="h-3.5 w-3.5" /> Edit pins
            </button>
          )}
          {editing && (
            <button type="button" onClick={savePositions} className="no-clay flex items-center gap-1.5 rounded-lg bg-violet-700 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-white">
              <Save className="h-3.5 w-3.5" /> Save pins
            </button>
          )}
          <button type="button" onClick={editing ? closeEditor : resetZoom} className="no-clay flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-white" aria-label={editing ? "Close pin editor" : "Reset campus map zoom to 100 percent"}>
            {editing ? <X className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {editing ? "Cancel" : "Reset 100%"}
          </button>
        </div>
      </div>
      <div
        ref={mapRef}
        className={`campus-plane relative aspect-square w-full overflow-hidden rounded-[22px] border-2 border-white/90 bg-slate-100 shadow-[0_26px_60px_-28px_rgba(15,23,42,.6),inset_1px_1px_2px_white,inset_0_-44px_80px_-44px_rgba(15,23,42,.38)] [transform-style:preserve-3d] ${editing ? "cursor-crosshair ring-2 ring-violet-500 ring-offset-2" : ""}`}
        onPointerMove={moveDraggedPin}
        onPointerUp={() => setDraggingId(null)}
        onPointerCancel={() => setDraggingId(null)}
        onClick={placeSelectedPin}
      >
        <div className="campus-map-world absolute inset-0" style={mapStyle}>
          <img
            src="/assets/campus-original-map.png"
            alt="Interactive campus map of Dearne Valley College"
            className="campus-map-image pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className="static-campus-pin-repair pointer-events-none absolute z-[9] h-[6.8%] w-[7.2%] -translate-x-1/2 -translate-y-1/2 bg-[#d6ccb4]"
            style={{ left: "62.85%", top: "67.6%" }}
          />
          <div className="pointer-events-none absolute inset-0 z-10 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.34)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.10)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/20 via-transparent to-slate-900/10" />

          {hotspots.map((spot) => {
            const Icon = spot.icon;
            const matchesFilter = !selectedId || activeZone === "all" || spot.filters.includes(activeZone);
            const isSelected = selectedId === spot.id;
            const isBeingEdited = editing && editSpotId === spot.id;

            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => editing ? setEditSpotId(spot.id) : focusHotspot(spot)}
                onPointerDown={(event) => {
                  if (!editing) return;
                  event.preventDefault();
                  setEditSpotId(spot.id);
                  setDraggingId(spot.id);
                  draggedRef.current = false;
                  const rect = mapRef.current?.getBoundingClientRect();
                  dragOffsetRef.current = rect
                    ? {
                        x: event.clientX - (rect.left + (spot.x / 100) * rect.width),
                        y: event.clientY - (rect.top + (spot.y / 100) * rect.height),
                      }
                    : { x: 0, y: 0 };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`campus-hotspot group absolute z-30 grid h-11 w-11 place-items-center transition-opacity duration-300 ${matchesFilter || editing ? "opacity-100" : "pointer-events-none opacity-40 grayscale"} ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
                aria-label={editing ? `Move ${spot.label} pin. Use arrow keys for precise positioning.` : `Focus map on ${spot.label}`}
                aria-pressed={isSelected || isBeingEdited}
                onKeyDown={(event) => nudgePin(event, spot)}
              >
                <span
                  className="relative grid h-11 w-11 place-items-center"
                  style={{ transform: selected && !editing ? `scale(${1 / selected.scale})` : "scale(1)" }}
                >
                  <span className={`campus-hotspot-pulse absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border ${isSelected || isBeingEdited ? "border-white bg-white/30" : "border-cyan-300/80 bg-cyan-300/15"}`} />
                  <span className={`relative grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br ${spot.colour} text-white shadow-sm transition group-hover:scale-110 ${isBeingEdited ? "ring-2 ring-violet-300" : ""}`}>
                    <MapPin className="absolute h-2.5 w-2.5 opacity-35" />
                    <Icon className="h-4 w-4" />
                  </span>
                  {!editing && (
                    <span className="campus-hotspot-tooltip pointer-events-none absolute bottom-9 left-1/2 w-max max-w-[190px] -translate-x-1/2 translate-y-1 rounded-xl border border-white/95 bg-white/94 px-3 py-2 text-left opacity-0 shadow-xl backdrop-blur-xl transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
                      <span className="block text-[10px] font-black text-slate-900">{spot.label}</span>
                      <span className="mt-0.5 block text-[9px] font-semibold text-[#4A5568]">{spot.detail}</span>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

      </div>
      </div>

        {editing ? (
          <div className="pf-map-editor relative z-40 mt-3 rounded-2xl border border-violet-200 bg-white/94 p-3 shadow-[0_12px_30px_-18px_rgba(15,23,42,.7)] backdrop-blur-xl">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[170px] flex-1 text-[9px] font-black uppercase tracking-[.12em] text-[#4A5568]">
                Pin
                <select
                  value={editSpotId}
                  onChange={(event) => setEditSpotId(event.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-900"
                >
                  {hotspots.map((spot) => <option key={spot.id} value={spot.id}>{spot.label}</option>)}
                </select>
              </label>
              {["x", "y"].map((axis) => (
                <label key={axis} className="w-24 text-[9px] font-black uppercase tracking-[.12em] text-[#4A5568]">
                  {axis.toUpperCase()} %
                  <input
                    type="number"
                    min="4"
                    max="96"
                    step="0.1"
                    value={editSpot[axis]}
                    onChange={(event) => updatePosition(editSpot.id, axis, event.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-900"
                  />
                </label>
              ))}
              <button type="button" onClick={restoreDefaults} className="no-clay h-9 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50">
                Restore defaults
              </button>
              <button type="button" onClick={savePositions} className="no-clay flex h-9 items-center gap-1.5 rounded-lg bg-violet-700 px-3 text-[10px] font-bold text-white hover:bg-violet-800">
                <Save className="h-3.5 w-3.5" /> Save positions
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-[#4A5568]">
              <Check className="h-3 w-3 text-emerald-600" /> Drag without snapping, click the map to place the selected pin, or use arrow keys for 0.1% adjustments (Shift for 1%).
            </p>
          </div>
        ) : (
          <div className="relative z-40 mt-3 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/95 bg-white/88 px-4 py-2.5 shadow-[0_12px_30px_-18px_rgba(15,23,42,.7)] backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[.12em] text-violet-800">
                  {selected ? "Destination located" : "Explore the campus"}
                </p>
                <p className="truncate text-xs font-black text-slate-950">
                  {selected?.label || "Select a department pin"}
                </p>
                <p className="truncate text-[9px] font-semibold text-[#4A5568]">
                  {selected?.detail || "Choose a department using the map filter"}
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-bold text-emerald-800 sm:inline">
              Interactive map
            </span>
          </div>
        )}
    </div>
  );
}

export default memo(CampusZoomMap);
