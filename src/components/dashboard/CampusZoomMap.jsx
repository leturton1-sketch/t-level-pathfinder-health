import { useEffect, useMemo, useState } from "react";
import { Building2, FlaskConical, HeartPulse, MapPin, RotateCcw, Trophy } from "lucide-react";

const HOTSPOTS = [
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
    id: "sports",
    label: "Sports Pitches",
    detail: "Outdoor learning zone",
    x: 70,
    y: 65,
    scale: 2.2,
    filters: ["health-theory-101"],
    icon: Trophy,
    colour: "from-amber-400 to-orange-600",
  },
  {
    id: "labs",
    label: "Laboratory / Informatics",
    detail: "Practical science and digital labs",
    x: 33,
    y: 48,
    scale: 2.4,
    filters: ["laboratory-informatics"],
    icon: FlaskConical,
    colour: "from-violet-500 to-indigo-700",
  },
];

export default function CampusZoomMap({ activeZone = "all" }) {
  const [selectedId, setSelectedId] = useState(null);
  const [resetView, setResetView] = useState(false);
  const selected = useMemo(() => HOTSPOTS.find((spot) => spot.id === selectedId), [selectedId]);

  useEffect(() => {
    if (activeZone === "all") return;
    const filteredHotspot = HOTSPOTS.find((spot) => spot.filters.includes(activeZone));
    if (filteredHotspot) {
      setResetView(false);
      setSelectedId(filteredHotspot.id);
    }
  }, [activeZone]);

  const focusHotspot = (spot) => {
    setResetView(false);
    setSelectedId(spot.id);
  };

  const resetZoom = () => {
    setSelectedId(null);
    setResetView(true);
  };

  const imageStyle = selected
    ? {
        animation: "none",
        transformOrigin: `${selected.x}% ${selected.y}%`,
        transform: `scale(${selected.scale})`,
      }
    : resetView
      ? { animation: "none", transformOrigin: "50% 41.5%", transform: "scale(1.08)" }
      : undefined;

  return (
    <div className="campus-map-shell relative mx-auto aspect-square w-full max-w-[720px]">
      <div className="campus-plane absolute inset-0 overflow-hidden rounded-[22px] border-2 border-white/90 bg-slate-100 shadow-[0_18px_42px_-24px_rgba(15,23,42,.52),inset_1px_1px_2px_white]">
        <img
          src="/assets/campus-original-map.png"
          alt="Interactive campus map of Dearne Valley College"
          className="campus-aerial campus-aerial-interactive absolute inset-0 h-full w-full object-cover"
          style={imageStyle}
        />
        <div className="pointer-events-none absolute inset-0 z-10 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.34)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.10)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/20 via-transparent to-slate-900/10" />

        <div className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-xl border border-white/90 bg-white/82 p-1.5 shadow-lg backdrop-blur-xl">
          <span className="hidden px-2 text-[9px] font-bold uppercase tracking-[.12em] text-slate-600 sm:inline">
            Map controls
          </span>
          <button
            type="button"
            onClick={resetZoom}
            className="no-clay flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Reset campus map zoom to 100 percent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset 100%
          </button>
        </div>

        {HOTSPOTS.map((spot) => {
          const Icon = spot.icon;
          const matchesFilter = activeZone === "all" || spot.filters.includes(activeZone);
          const isSelected = selectedId === spot.id;

          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => focusHotspot(spot)}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className={`campus-hotspot group absolute z-30 -translate-x-1/2 -translate-y-1/2 transition duration-300 ${matchesFilter ? "opacity-100" : "pointer-events-none opacity-20 grayscale"}`}
              aria-label={`Focus map on ${spot.label}`}
              aria-pressed={isSelected}
            >
              <span className={`campus-hotspot-pulse absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${isSelected ? "border-white bg-white/30" : "border-cyan-300/80 bg-cyan-300/15"}`} />
              <span className={`relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br ${spot.colour} text-white shadow-[0_0_0_5px_rgba(255,255,255,.24),0_0_28px_rgba(34,211,238,.75)] transition group-hover:scale-110`}>
                <MapPin className="absolute h-5 w-5 opacity-35" />
                <Icon className="h-4 w-4" />
              </span>
              <span className={`absolute left-1/2 top-12 w-max max-w-[190px] -translate-x-1/2 rounded-xl border border-white/95 bg-white/90 px-3 py-2 text-left shadow-xl backdrop-blur-xl transition ${isSelected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100"}`}>
                <span className="block text-[10px] font-black text-slate-900">{spot.label}</span>
                <span className="mt-0.5 block text-[9px] font-semibold text-[#4A5568]">{spot.detail}</span>
              </span>
            </button>
          );
        })}

        <div className="absolute inset-x-3 bottom-3 z-40 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/95 bg-white/84 px-4 py-2.5 shadow-[0_12px_30px_-18px_rgba(15,23,42,.7)] backdrop-blur-xl">
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
      </div>
    </div>
  );
}
