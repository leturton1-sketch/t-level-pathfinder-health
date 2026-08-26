import { useEffect, useMemo, useRef, useState } from "react";
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

export default function CampusZoomMap({ activeZone = "all" }) {
  const [hotspots, setHotspots] = useState(DEFAULT_HOTSPOTS);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editSpotId, setEditSpotId] = useState("health");
  const [draggingId, setDraggingId] = useState(null);
  const mapRef = useRef(null);
  const editBaselineRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
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
    if (activeZone === "all" || editing) return;
    const filteredHotspot = hotspots.find((spot) => spot.filters.includes(activeZone));
    if (filteredHotspot) setSelectedId(filteredHotspot.id);
  }, [activeZone, editing, hotspots]);

  const focusHotspot = (spot) => {
    if (!editing) setSelectedId(spot.id);
  };

  const resetZoom = () => {
    setSelectedId(null);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    editBaselineRef.current = null;
    setEditing(false);
    setDraggingId(null);
  };

  const restoreDefaults = () => {
    setHotspots(DEFAULT_HOTSPOTS);
    setEditSpotId("health");
  };

  const moveDraggedPin = (event) => {
    if (!editing || !draggingId || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    updatePosition(draggingId, "x", ((event.clientX - rect.left) / rect.width) * 100);
    updatePosition(draggingId, "y", ((event.clientY - rect.top) / rect.height) * 100);
  };

  const mapStyle = selected && !editing
    ? {
        transformOrigin: `${selected.x}% ${selected.y}%`,
        transform: `scale(${selected.scale})`,
      }
    : { transformOrigin: "50% 50%", transform: "scale(1)" };

  return (
    <div className="campus-map-shell relative mx-auto w-full max-w-[720px]">
      <div
        ref={mapRef}
        className={`campus-plane relative aspect-square w-full overflow-hidden rounded-[22px] border-2 border-white/90 bg-slate-100 shadow-[0_18px_42px_-24px_rgba(15,23,42,.52),inset_1px_1px_2px_white] ${editing ? "cursor-crosshair ring-2 ring-violet-500 ring-offset-2" : ""}`}
        onPointerMove={moveDraggedPin}
        onPointerUp={() => setDraggingId(null)}
        onPointerCancel={() => setDraggingId(null)}
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
            const matchesFilter = activeZone === "all" || spot.filters.includes(activeZone);
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
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: selected && !editing
                    ? `translate(-50%, -50%) scale(${1 / selected.scale})`
                    : "translate(-50%, -50%)",
                }}
                className={`campus-hotspot group absolute z-30 transition-opacity duration-300 ${matchesFilter || editing ? "opacity-100" : "pointer-events-none opacity-20 grayscale"} ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
                aria-label={editing ? `Move ${spot.label} pin` : `Focus map on ${spot.label}`}
                aria-pressed={isSelected || isBeingEdited}
              >
                <span className={`campus-hotspot-pulse absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${isSelected || isBeingEdited ? "border-white bg-white/30" : "border-cyan-300/80 bg-cyan-300/15"}`} />
                <span className={`relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br ${spot.colour} text-white shadow-[0_0_0_5px_rgba(255,255,255,.24),0_0_28px_rgba(34,211,238,.75)] transition group-hover:scale-110 ${isBeingEdited ? "ring-4 ring-violet-300" : ""}`}>
                  <MapPin className="absolute h-5 w-5 opacity-35" />
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`campus-hotspot-tooltip pointer-events-none absolute bottom-12 left-1/2 w-max max-w-[190px] -translate-x-1/2 rounded-xl border border-white/95 bg-white/94 px-3 py-2 text-left shadow-xl backdrop-blur-xl transition ${isBeingEdited ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100"}`}>
                  <span className="block text-[10px] font-black text-slate-900">{spot.label}</span>
                  <span className="mt-0.5 block text-[9px] font-semibold text-[#4A5568]">
                    {editing ? `X ${spot.x}% · Y ${spot.y}%` : spot.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-xl border border-white/90 bg-white/88 p-1.5 shadow-lg backdrop-blur-xl">
          <span className="hidden px-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#4A5568] sm:inline">
            Map controls
          </span>
          {!editing && (
            <button
              type="button"
              onClick={openEditor}
              className="no-clay flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-[10px] font-bold text-violet-800 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit pins
            </button>
          )}
          <button
            type="button"
            onClick={editing ? closeEditor : resetZoom}
            className="no-clay flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={editing ? "Close pin editor" : "Reset campus map zoom to 100 percent"}
          >
            {editing ? <X className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {editing ? "Cancel" : "Reset 100%"}
          </button>
        </div>

      </div>

        {editing ? (
          <div className="relative z-40 mt-3 rounded-2xl border border-violet-200 bg-white/94 p-3 shadow-[0_12px_30px_-18px_rgba(15,23,42,.7)] backdrop-blur-xl">
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
              <Check className="h-3 w-3 text-emerald-600" /> Drag a pin on the map or enter exact percentage coordinates.
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
                  {selected?.label || "Select a glowing department pin"}
                </p>
                <p className="truncate text-[9px] font-semibold text-[#4A5568]">
                  {selected?.detail || "Use the filters above to highlight relevant areas"}
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
